package tn.fitcoach

import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/** Shown by Health Connect ("why does this app need my data?") — required to request health permissions. */
class PrivacyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val tv = TextView(this).apply {
            setPadding(48, 64, 48, 64)
            textSize = 16f
            text = """
FitCoach — Confidentialité / Privacy / الخصوصية

FR — FitCoach lit (sans jamais les modifier) vos pas, fréquence cardiaque, sommeil, calories, distance, séances, SpO2, tension, poids et glycémie depuis Health Connect pour afficher vos rapports santé et adapter vos entraînements. Ces données restent sur votre téléphone, chiffrées dans votre compte FitCoach. Elles ne sont jamais envoyées à un serveur ni vendues. Vous pouvez retirer l'accès à tout moment dans Health Connect.

EN — FitCoach reads (never writes) your steps, heart rate, sleep, calories, distance, workouts, SpO2, blood pressure, weight and blood glucose from Health Connect to show your health reports and adapt your training. The data stays on your phone, encrypted in your FitCoach account. It is never sent to a server or sold. You can revoke access at any time in Health Connect.

AR — يقرأ FitCoach (دون أي تعديل) خطواتك ونبضك ونومك وسعراتك والمسافة والحصص وتشبع الأكسجين والضغط والوزن وسكر الدم من Health Connect لعرض تقاريرك الصحية وتكييف تدريبك. تبقى البيانات على هاتفك مشفّرة في حسابك ولا تُرسل إلى أي خادم ولا تُباع. يمكنك سحب الإذن في أي وقت من Health Connect.
""".trimIndent()
        }
        setContentView(ScrollView(this).apply { addView(tv) })
    }
}
