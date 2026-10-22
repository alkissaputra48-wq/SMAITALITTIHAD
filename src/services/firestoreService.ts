import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Student,
  AttendanceRecord,
  AttendanceCategory,
  LetterheadConfig,
} from '../types';
import {
  STUDENTS_XII_1,
  DEFAULT_CATEGORIES,
  DEFAULT_LETTERHEAD,
} from './storage';

const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
};

export const FirestoreService = {
  /**
   * Initialize Firestore default collections if empty (seed XII 1 real students, NO dummy attendance records)
   */
  async initializeDatabaseIfEmpty(): Promise<void> {
    try {
      // 1. Check students
      const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      if (studentsSnapshot.empty) {
        console.log('Seeding initial XII 1 students to Firestore...');
        for (const student of STUDENTS_XII_1) {
          await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
        }
      }

      // 2. Check categories
      const categoriesSnapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      if (categoriesSnapshot.empty) {
        console.log('Seeding initial categories to Firestore...');
        for (const category of DEFAULT_CATEGORIES) {
          await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), category);
        }
      }

      // 3. Check settings (Letterhead)
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'letterhead');
      const settingsSnap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
      if (settingsSnap.empty) {
        await setDoc(settingsRef, DEFAULT_LETTERHEAD);
      }

      // Note: Attendance collection is intentionally left empty (no dummy logs) per user instruction:
      // "Untuk data dummy kosongkan saja."
    } catch (error) {
      console.warn('Initial Firestore seed note:', error);
    }
  },

  /**
   * Real-time listener for students collection
   */
  subscribeStudents(callback: (students: Student[]) => void): () => void {
    const colRef = collection(db, COLLECTIONS.STUDENTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const students: Student[] = [];
        snapshot.forEach((doc) => {
          students.push(doc.data() as Student);
        });
        callback(students);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.STUDENTS);
      }
    );
  },

  /**
   * Real-time listener for attendance records
   */
  subscribeAttendance(callback: (records: AttendanceRecord[]) => void): () => void {
    const colRef = collection(db, COLLECTIONS.ATTENDANCE);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          records.push(doc.data() as AttendanceRecord);
        });
        // Sort descending by date and time
        records.sort((a, b) => {
          const dtA = `${a.date} ${a.time}`;
          const dtB = `${b.date} ${b.time}`;
          return dtB.localeCompare(dtA);
        });
        callback(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.ATTENDANCE);
      }
    );
  },

  /**
   * Real-time listener for categories
   */
  subscribeCategories(callback: (categories: AttendanceCategory[]) => void): () => void {
    const colRef = collection(db, COLLECTIONS.CATEGORIES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const categories: AttendanceCategory[] = [];
        snapshot.forEach((doc) => {
          categories.push(doc.data() as AttendanceCategory);
        });
        callback(categories);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.CATEGORIES);
      }
    );
  },

  /**
   * Real-time listener for Letterhead
   */
  subscribeLetterhead(callback: (letterhead: LetterheadConfig) => void): () => void {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'letterhead');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as LetterheadConfig);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SETTINGS}/letterhead`);
      }
    );
  },

  /**
   * Save or update student
   */
  async saveStudent(student: Student): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.STUDENTS}/${student.id}`);
    }
  },

  /**
   * Delete student
   */
  async deleteStudent(studentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.STUDENTS}/${studentId}`);
    }
  },

  /**
   * Save or update attendance record
   */
  async saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.ATTENDANCE, record.id), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.ATTENDANCE}/${record.id}`);
    }
  },

  /**
   * Delete attendance record
   */
  async deleteAttendanceRecord(recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, recordId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ATTENDANCE}/${recordId}`);
    }
  },

  /**
   * Save category
   */
  async saveCategory(category: AttendanceCategory): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), category);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.CATEGORIES}/${category.id}`);
    }
  },

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.CATEGORIES}/${categoryId}`);
    }
  },

  /**
   * Save letterhead configuration
   */
  async saveLetterhead(letterhead: LetterheadConfig): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'letterhead'), letterhead);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/letterhead`);
    }
  },

  /**
   * Clear all attendance data (e.g., reset dummy records)
   */
  async clearAttendanceData(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.ATTENDANCE);
    }
  },
};
