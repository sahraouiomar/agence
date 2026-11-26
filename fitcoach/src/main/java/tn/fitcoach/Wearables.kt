package tn.fitcoach

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.aggregate.AggregateMetric
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BloodGlucoseRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.util.UUID
import kotlin.math.pow
import kotlin.reflect.KClass

/**
 * Health Connect: the Android health data hub. Watch apps (Samsung Health, Fitbit, Pixel Watch / Wear OS,
 * Garmin Connect, Zepp / Amazfit, Mi Fitness, Withings, Polar, Oura, Huawei via Health Sync…) write
 * steps, heart rate, sleep, SpO2, blood pressure… there and FitCoach reads them (read-only, stays on phone).
 */
class HealthHub(private val ctx: Context) {
    val READ: Map<String, KClass<out Record>> = mapOf(
        "steps" to StepsRecord::class, "hr" to HeartRateRecord::class, "rhr" to RestingHeartRateRecord::class,
        "sleep" to SleepSessionRecord::class, "active" to ActiveCaloriesBurnedRecord::class,
        "total" to TotalCaloriesBurnedRecord::class, "distance" to DistanceRecord::class,
        "exercise" to ExerciseSessionRecord::class, "spo2" to OxygenSaturationRecord::class,
        "bp" to BloodPressureRecord::class, "weight" to WeightRecord::class, "glucose" to BloodGlucoseRecord::class,
    )
    val permissions: Set<String> = READ.values.map { HealthPermission.getReadPermission(it) }.toSet()

    fun status(): String = when (HealthConnectClient.getSdkStatus(ctx)) {
        HealthConnectClient.SDK_AVAILABLE -> "available"
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update"
        else -> "unavailable"
    }

    private val client by lazy { HealthConnectClient.getOrCreate(ctx) }

    suspend fun granted(): Set<String> = client.permissionController.getGrantedPermissions()

    /** Daily totals for the last [days] days + individual measurements. */
    suspend fun read(days: Int): JSONObject {
        val g = granted()
        fun has(k: String) = HealthPermission.getReadPermission(READ.getValue(k)) in g
        val metrics = mutableSetOf<AggregateMetric<*>>()
        if (has("steps")) metrics += StepsRecord.COUNT_TOTAL
        if (has("distance")) metrics += DistanceRecord.DISTANCE_TOTAL
        if (has("active")) metrics += ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL
        if (has("total")) metrics += TotalCaloriesBurnedRecord.ENERGY_TOTAL
        if (has("hr")) { metrics += HeartRateRecord.BPM_AVG; metrics += HeartRateRecord.BPM_MIN; metrics += HeartRateRecord.BPM_MAX }
        if (has("rhr")) metrics += RestingHeartRateRecord.BPM_AVG
        if (has("sleep")) metrics += SleepSessionRecord.SLEEP_DURATION_TOTAL
        if (has("exercise")) metrics += ExerciseSessionRecord.EXERCISE_DURATION_TOTAL

        val out = JSONObject()
        val dayArr = JSONArray()
        val today = LocalDate.now()
        val start = today.minusDays(days.toLong() - 1).atStartOfDay()
        val end = today.plusDays(1).atStartOfDay()
        if (metrics.isNotEmpty()) {
            // in chunks of 90 days to stay well under Health Connect limits
            var from = start
            while (from.isBefore(end)) {
                val to = minOf(from.plusDays(90), end)
                val groups = client.aggregateGroupByPeriod(
                    AggregateGroupByPeriodRequest(metrics, TimeRangeFilter.between(from, to), Period.ofDays(1))
                )
                for (gr in groups) {
                    val r = gr.result
                    val o = JSONObject().put("date", gr.startTime.toLocalDate().toString())
                    r[StepsRecord.COUNT_TOTAL]?.let { o.put("steps", it) }
                    r[DistanceRecord.DISTANCE_TOTAL]?.let { o.put("km", Math.round(it.inMeters / 10.0) / 100.0) }
                    r[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { o.put("active", Math.round(it.inKilocalories)) }
                    r[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.let { o.put("total", Math.round(it.inKilocalories)) }
                    r[HeartRateRecord.BPM_AVG]?.let { o.put("hrAvg", it) }
                    r[HeartRateRecord.BPM_MIN]?.let { o.put("hrMin", it) }
                    r[HeartRateRecord.BPM_MAX]?.let { o.put("hrMax", it) }
                    r[RestingHeartRateRecord.BPM_AVG]?.let { o.put("rhr", it) }
                    r[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.let { o.put("sleepMin", it.toMinutes()) }
                    r[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.let { o.put("exMin", it.toMinutes()) }
                    if (o.length() > 1) dayArr.put(o)
                }
                from = to
            }
        }
        out.put("days", dayArr)

        val meas = JSONArray()
        val since = Instant.now().minusSeconds(days * 86400L)
        suspend fun <T : Record> each(k: String, cls: KClass<T>, f: (T) -> JSONObject?) {
            if (!has(k)) return
            var token: String? = null
            var pages = 0
            do {
                val resp = client.readRecords(ReadRecordsRequest(cls, TimeRangeFilter.after(since), pageSize = 1000, pageToken = token))
                resp.records.forEach { rec -> f(rec)?.let { meas.put(it) } }
                token = resp.pageToken
                pages++
            } while (token != null && pages < 10)
        }
        each("bp", BloodPressureRecord::class) {
            JSONObject().put("type", "bp").put("t", it.time.toEpochMilli())
                .put("v", JSONObject().put("sys", Math.round(it.systolic.inMillimetersOfMercury)).put("dia", Math.round(it.diastolic.inMillimetersOfMercury)))
        }
        each("weight", WeightRecord::class) {
            JSONObject().put("type", "weight").put("t", it.time.toEpochMilli()).put("v", JSONObject().put("val", Math.round(it.weight.inKilograms * 10) / 10.0))
        }
        each("spo2", OxygenSaturationRecord::class) {
            JSONObject().put("type", "spo2").put("t", it.time.toEpochMilli()).put("v", JSONObject().put("val", Math.round(it.percentage.value)))
        }
        each("glucose", BloodGlucoseRecord::class) {
            val ctx = if (it.relationToMeal == BloodGlucoseRecord.RELATION_TO_MEAL_AFTER_MEAL) "after" else "fasting"
            JSONObject().put("type", "glucose").put("t", it.time.toEpochMilli())
                .put("v", JSONObject().put("val", Math.round(it.level.inMilligramsPerDeciliter) / 100.0).put("ctx", ctx))
        }
        out.put("measures", meas)
        out.put("granted", JSONArray(READ.keys.filter { has(it) }))
        return out
    }
}

/**
 * Direct Bluetooth Low Energy link with any device using the standard Bluetooth SIG health profiles:
 * Heart Rate (0x180D: chest straps, Polar / Garmin / Coros / Amazfit / Wear OS watches in "HR broadcast"),
 * Blood Pressure (0x1810), Pulse Oximeter (0x1822) and Weight Scale (0x181D).
 */
@SuppressLint("MissingPermission")
class BleHub(private val ctx: Context, private val emit: (JSONObject) -> Unit) {
    private val main = Handler(Looper.getMainLooper())
    private val adapter get() = ctx.getSystemService(BluetoothManager::class.java)?.adapter
    private var gatt: BluetoothGatt? = null
    private val seen = mutableMapOf<String, BluetoothDevice>()
    private val queue = ArrayDeque<BluetoothGattCharacteristic>()
    private var scanning = false

    private fun u16(x: Int) = UUID.fromString(String.format("0000%04x-0000-1000-8000-00805f9b34fb", x))
    private val KIND = mapOf(u16(0x180D) to "hr", u16(0x1810) to "bp", u16(0x1822) to "spo2", u16(0x181D) to "weight")
    private val CCCD = u16(0x2902)

    fun enabled() = adapter?.isEnabled == true

    private val scanCb = object : ScanCallback() {
        override fun onScanResult(type: Int, r: ScanResult) {
            val d = r.device
            val name = r.scanRecord?.deviceName ?: try { d.name } catch (_: SecurityException) { null }
            val kinds = r.scanRecord?.serviceUuids?.mapNotNull { KIND[it.uuid] }?.distinct() ?: emptyList()
            if (name.isNullOrBlank() && kinds.isEmpty()) return
            seen[d.address] = d
            emit(JSONObject().put("type", "device").put("id", d.address).put("name", name ?: "?")
                .put("rssi", r.rssi).put("kinds", JSONArray(kinds)))
        }
        override fun onScanFailed(errorCode: Int) { scanning = false; emit(JSONObject().put("type", "error").put("msg", "scan $errorCode")) }
    }

    fun scan() {
        val sc = adapter?.bluetoothLeScanner ?: run { emit(JSONObject().put("type", "error").put("msg", "bluetooth off")); return }
        if (scanning) return
        scanning = true
        sc.startScan(null, ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(), scanCb)
        main.postDelayed({ stopScan(); emit(JSONObject().put("type", "scanEnd")) }, 12000)
    }

    fun stopScan() {
        if (!scanning) return
        scanning = false
        try { adapter?.bluetoothLeScanner?.stopScan(scanCb) } catch (_: Exception) {}
    }

    fun connect(address: String) {
        stopScan()
        disconnect()
        val dev = seen[address] ?: adapter?.getRemoteDevice(address) ?: return
        emit(JSONObject().put("type", "state").put("state", "connecting").put("id", address))
        gatt = dev.connectGatt(ctx, false, gattCb, BluetoothDevice.TRANSPORT_LE)
    }

    fun disconnect() {
        gatt?.let { try { it.disconnect(); it.close() } catch (_: Exception) {} }
        gatt = null
        queue.clear()
    }

    private fun next(g: BluetoothGatt) {
        val ch = queue.removeFirstOrNull() ?: return
        g.setCharacteristicNotification(ch, true)
        val d = ch.getDescriptor(CCCD) ?: return next(g)
        val v = if (ch.properties and BluetoothGattCharacteristic.PROPERTY_INDICATE != 0)
            BluetoothGattDescriptor.ENABLE_INDICATION_VALUE else BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
        if (Build.VERSION.SDK_INT >= 33) g.writeDescriptor(d, v)
        else { @Suppress("DEPRECATION") run { d.value = v; g.writeDescriptor(d) } }
    }

    private val gattCb = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                emit(JSONObject().put("type", "state").put("state", "connected").put("id", g.device.address))
                g.discoverServices()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                emit(JSONObject().put("type", "state").put("state", "disconnected").put("id", g.device.address))
            }
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
            queue.clear()
            for (c in listOf(0x2A37, 0x2A35, 0x2A5E, 0x2A5F, 0x2A9D)) {
                g.services.forEach { s -> s.getCharacteristic(u16(c))?.let { queue.add(it) } }
            }
            emit(JSONObject().put("type", "services").put("kinds", JSONArray(g.services.mapNotNull { KIND[it.uuid] })))
            next(g)
        }

        override fun onDescriptorWrite(g: BluetoothGatt, d: BluetoothGattDescriptor, status: Int) = next(g)

        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic, value: ByteArray) = handle(ch.uuid, value)

        @Deprecated("Android 12 and lower")
        override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT < 33) handle(ch.uuid, ch.value ?: return)
        }
    }

    // IEEE-11073 16-bit SFLOAT used by the Bluetooth health profiles
    private fun sfloat(v: ByteArray, o: Int): Double {
        val raw = (v[o].toInt() and 0xFF) or ((v[o + 1].toInt() and 0xFF) shl 8)
        var m = raw and 0x0FFF
        var e = raw shr 12
        if (m >= 0x0800) m -= 0x1000
        if (e >= 0x8) e -= 0x10
        return m * 10.0.pow(e)
    }

    private fun handle(id: UUID, v: ByteArray) {
        if (v.isEmpty()) return
        val f = v[0].toInt()
        try {
            when (id) {
                u16(0x2A37) -> {
                    val bpm = if (f and 1 != 0) (v[1].toInt() and 0xFF) or ((v[2].toInt() and 0xFF) shl 8) else v[1].toInt() and 0xFF
                    emit(JSONObject().put("type", "hr").put("bpm", bpm).put("t", System.currentTimeMillis()))
                }
                u16(0x2A35) -> {
                    val k = if (f and 1 != 0) 7.50062 else 1.0
                    var i = 7
                    if (f and 2 != 0) i += 7
                    val o = JSONObject().put("type", "bp").put("sys", Math.round(sfloat(v, 1) * k)).put("dia", Math.round(sfloat(v, 3) * k))
                    if (f and 4 != 0 && v.size >= i + 2) o.put("pulse", Math.round(sfloat(v, i)))
                    emit(o.put("t", System.currentTimeMillis()))
                }
                u16(0x2A5E), u16(0x2A5F) -> emit(JSONObject().put("type", "spo2").put("val", Math.round(sfloat(v, 1)))
                    .put("pulse", Math.round(sfloat(v, 3))).put("t", System.currentTimeMillis()))
                u16(0x2A9D) -> {
                    val raw = (v[1].toInt() and 0xFF) or ((v[2].toInt() and 0xFF) shl 8)
                    val kg = if (f and 1 != 0) raw * 0.01 * 0.453592 else raw * 0.005
                    emit(JSONObject().put("type", "weight").put("kg", Math.round(kg * 10) / 10.0).put("t", System.currentTimeMillis()))
                }
            }
        } catch (_: Exception) {}
    }
}
