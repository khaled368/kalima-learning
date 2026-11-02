package com.kalima.learning;
import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Opt-in, local Android reminder: no push service or internet required. */
public final class DailyReminderReceiver extends BroadcastReceiver {
  static final String PREFS="kalima_daily_reminder";
  static final String ACTION="com.kalima.learning.REMIND_WORDS";
  private static final String CHANNEL="kalima_words_daily";
  private static final int GOAL=20;
  static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);}
  static boolean allowed(Context c){
    return Build.VERSION.SDK_INT<33 ||
        c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED;
  }
  static void configure(Context c,boolean enabled,int hour,int minute,String lang){
    if(hour<0||hour>23||minute<0||minute>59)return;
    String language="en".equals(lang)||"de".equals(lang)||"nl".equals(lang)?lang:"ar";
    prefs(c).edit().putBoolean("enabled",enabled).putInt("hour",hour)
        .putInt("minute",minute).putString("lang",language).apply();
    schedule(c);
  }
  static void progress(Context c,String day,int count,String lang){
    if(day==null||!day.matches("\\d{4}-\\d{2}-\\d{2}")||count<0||count>1000000)return;
    SharedPreferences.Editor e=prefs(c).edit().putString("day",day).putInt("count",count);
    if("ar".equals(lang)||"en".equals(lang)||"nl".equals(lang)||"de".equals(lang))e.putString("lang",lang);
    e.apply();
  }
  static void channel(Context c){
    NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
    if(m!=null)m.createNotificationChannel(new NotificationChannel(
        CHANNEL,"هدف الكلمات اليومي",NotificationManager.IMPORTANCE_DEFAULT));
  }
  private static PendingIntent alarm(Context c){
    Intent i=new Intent(c,DailyReminderReceiver.class).setAction(ACTION);
    return PendingIntent.getBroadcast(c,810,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  }
  static void schedule(Context c){
    AlarmManager m=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
    if(m==null)return;
    PendingIntent p=alarm(c);m.cancel(p);
    SharedPreferences s=prefs(c);if(!s.getBoolean("enabled",false))return;
    Calendar next=Calendar.getInstance();
    next.set(Calendar.HOUR_OF_DAY,s.getInt("hour",20));
    next.set(Calendar.MINUTE,s.getInt("minute",0));
    next.set(Calendar.SECOND,0);next.set(Calendar.MILLISECOND,0);
    if(next.getTimeInMillis()<=System.currentTimeMillis())next.add(Calendar.DAY_OF_YEAR,1);
    // Inexact delivery avoids restricted exact-alarm permission.
    m.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next.getTimeInMillis(),p);
  }
  @Override public void onReceive(Context c,Intent intent){
    if(intent==null)return;
    String action=intent.getAction();
    if(!ACTION.equals(action)){
      if(Intent.ACTION_BOOT_COMPLETED.equals(action)||
         Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)||
         Intent.ACTION_TIME_CHANGED.equals(action)||
         Intent.ACTION_TIMEZONE_CHANGED.equals(action))schedule(c);
      return;
    }
    SharedPreferences s=prefs(c);if(!s.getBoolean("enabled",false))return;
    schedule(c); // Continue tomorrow even when today's target is met.
    if(!allowed(c))return;
    String today=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date());
    int count=today.equals(s.getString("day",""))?s.getInt("count",0):0;
    if(count>=GOAL)return;
    channel(c);
    String lang=s.getString("lang","ar"),title,message;
    if("de".equals(lang)){title="Dein tägliches Kalima-Ziel";message="Heute: "+count+" von 20 Wörtern. Lerne weiter!";}
    else if("en".equals(lang)){title="Your daily Kalima goal";message="Today: "+count+" of 20 words. Keep learning!";}
    else if("nl".equals(lang)){title="Je dagelijkse Kalima-doel";message="Vandaag: "+count+" van 20 woorden. Ga verder!";}
    else{title="هدفك اليومي في كلمة";message="تعلّمت اليوم "+count+" من 20 كلمة. افتح كلمة وأكمل هدفك!";}
    Intent open=new Intent(c,MainActivity.class)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent launch=PendingIntent.getActivity(c,0,open,
        PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification n=new Notification.Builder(c,CHANNEL)
        .setSmallIcon(R.drawable.ic_kalima).setContentTitle(title).setContentText(message)
        .setStyle(new Notification.BigTextStyle().bigText(message))
        .setAutoCancel(true).setContentIntent(launch).build();
    NotificationManager m=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
    if(m!=null)m.notify(811,n);
  }
}
