// @ts-ignore
import { NlpManager } from 'node-nlp';

let manager: any = null;

export async function initNLP() {
  if (manager) return manager;

  // Initialize NLP manager with English language
  manager = new NlpManager({ languages: ['en'], forceNER: true, nlu: { log: false } });

  // 1. get_schedule
  manager.addDocument('en', 'when is my next class', 'get_schedule.next');
  manager.addDocument('en', 'what is my next class', 'get_schedule.next');
  manager.addDocument('en', 'next class', 'get_schedule.next');
  manager.addDocument('en', 'schedule for tomorrow', 'get_schedule.tomorrow');
  manager.addDocument('en', 'classes tomorrow', 'get_schedule.tomorrow');
  manager.addDocument('en', 'tomorrow schedule', 'get_schedule.tomorrow');
  manager.addDocument('en', 'schedule for today', 'get_schedule.today');
  manager.addDocument('en', 'what do i have today', 'get_schedule.today');
  manager.addDocument('en', 'timetable', 'get_schedule.today');
  manager.addDocument('en', 'my schedule', 'get_schedule.today');
  manager.addDocument('en', 'class today', 'get_schedule.today');
  manager.addDocument('en', 'today', 'get_schedule.today');
  
  // 2. mark_attendance
  manager.addDocument('en', 'mark dbms as present', 'mark_attendance.present');
  manager.addDocument('en', 'attended dbms', 'mark_attendance.present');
  manager.addDocument('en', 'went to dbms', 'mark_attendance.present');
  manager.addDocument('en', 'present for dbms', 'mark_attendance.present');
  manager.addDocument('en', 'bunked dbms', 'mark_attendance.absent');
  manager.addDocument('en', 'skipped dbms', 'mark_attendance.absent');
  manager.addDocument('en', 'missed dbms', 'mark_attendance.absent');
  manager.addDocument('en', 'mark dbms as absent', 'mark_attendance.absent');
  manager.addDocument('en', 'absent for dbms', 'mark_attendance.absent');
  manager.addDocument('en', 'mark dbms as late', 'mark_attendance.late');
  manager.addDocument('en', 'late for dbms', 'mark_attendance.late');
  manager.addDocument('en', 'reached late dbms', 'mark_attendance.late');
  
  // 3. mark_bulk_attendance
  manager.addDocument('en', 'attended all classes', 'mark_bulk_attendance.present');
  manager.addDocument('en', 'mark all present', 'mark_bulk_attendance.present');
  manager.addDocument('en', 'went to everything', 'mark_bulk_attendance.present');
  manager.addDocument('en', 'bunked all', 'mark_bulk_attendance.absent');
  manager.addDocument('en', 'mark all absent', 'mark_bulk_attendance.absent');
  manager.addDocument('en', 'skipped all classes', 'mark_bulk_attendance.absent');

  // 4. get_analytics
  manager.addDocument('en', 'what is my overall attendance', 'get_analytics');
  manager.addDocument('en', 'show stats', 'get_analytics');
  manager.addDocument('en', 'overall stats', 'get_analytics');
  manager.addDocument('en', 'how is my attendance', 'get_analytics');
  manager.addDocument('en', 'analytics', 'get_analytics');

  // 5. get_subject_info
  manager.addDocument('en', 'how am i doing in dbms', 'get_subject_info');
  manager.addDocument('en', 'dbms stats', 'get_subject_info');
  manager.addDocument('en', 'attendance for dbms', 'get_subject_info');
  manager.addDocument('en', 'details for dbms', 'get_subject_info');

  // 6. skip_optimizer
  manager.addDocument('en', 'can i bunk dbms', 'skip_optimizer');
  manager.addDocument('en', 'how many classes can i skip', 'skip_optimizer');
  manager.addDocument('en', 'is it safe to skip', 'skip_optimizer');
  manager.addDocument('en', 'can i bunk today', 'skip_optimizer');
  manager.addDocument('en', 'safe skips', 'skip_optimizer');

  // 7. schedule_override
  manager.addDocument('en', 'cancel dbms today', 'schedule_override');
  manager.addDocument('en', 'reschedule dbms', 'schedule_override');
  manager.addDocument('en', 'extra class dbms', 'schedule_override');
  manager.addDocument('en', 'swap dbms and os', 'schedule_override');

  // 8. get_attendance_history
  manager.addDocument('en', 'history for last 7 days', 'get_attendance_history');
  manager.addDocument('en', 'past records', 'get_attendance_history');
  manager.addDocument('en', 'attendance history', 'get_attendance_history');
  manager.addDocument('en', 'what did i attend last week', 'get_attendance_history');

  await manager.train();
  return manager;
}

export async function analyzeIntent(text: string): Promise<{ intent: string, score: number }> {
  const nlp = await initNLP();
  const response = await nlp.process('en', text);
  return { intent: response.intent || 'None', score: response.score || 0 };
}
