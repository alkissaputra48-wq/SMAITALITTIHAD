/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Student,
  AttendanceRecord,
  AttendanceCategory,
  User,
  ApiSyncConfig,
  SyncLog,
  NotificationLog,
  AttendanceStatus,
  LetterheadConfig,
} from './types';
import { StorageService } from './services/storage';
import { ApiSyncService } from './services/apiSyncService';
import { soundFx } from './services/audioService';
import { FirestoreService } from './services/firestoreService';
import { testFirestoreConnection } from './lib/firebase';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { QrScannerView } from './components/Scanner/QrScannerView';
import { AttendanceTable } from './components/Attendance/AttendanceTable';
import { ManualAttendanceModal } from './components/Attendance/ManualAttendanceModal';
import { MonthlyRecapMatrix } from './components/Recap/MonthlyRecapMatrix';
import { StudentList } from './components/Students/StudentList';
import { CategoryManager } from './components/Categories/CategoryManager';
import { ParentNotificationCenter } from './components/Notifications/ParentNotificationCenter';
import { ApiConfigView } from './components/Sync/ApiConfigView';
import { UserManagement } from './components/Auth/UserManagement';
import { LoginModal } from './components/Auth/LoginModal';

export default function App() {
  // Application Data States
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [categories, setCategories] = useState<AttendanceCategory[]>(() => StorageService.getCategories());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [apiConfig, setApiConfig] = useState<ApiSyncConfig>(() => StorageService.getApiConfig());
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => StorageService.getSyncLogs());
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => StorageService.getNotifications());
  const [letterhead, setLetterhead] = useState<LetterheadConfig>(() => StorageService.getLetterhead());

  // UI States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Real-time Firestore sync & initial setup
  useEffect(() => {
    testFirestoreConnection().catch(console.warn);
    FirestoreService.initializeDatabaseIfEmpty().catch(console.warn);

    const unsubStudents = FirestoreService.subscribeStudents((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        setStudents(remoteStudents);
      }
    });

    const unsubAttendance = FirestoreService.subscribeAttendance((remoteAttendance) => {
      setAttendanceRecords(remoteAttendance);
    });

    const unsubCategories = FirestoreService.subscribeCategories((remoteCategories) => {
      if (remoteCategories && remoteCategories.length > 0) {
        setCategories(remoteCategories);
      }
    });

    const unsubLetterhead = FirestoreService.subscribeLetterhead((remoteLetterhead) => {
      if (remoteLetterhead && remoteLetterhead.schoolName) {
        setLetterhead(remoteLetterhead);
      }
    });

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubCategories();
      unsubLetterhead();
    };
  }, []);

  // Save changes to localStorage as fallback
  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    StorageService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    StorageService.saveStudents(students);
  }, [students]);

  useEffect(() => {
    StorageService.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    StorageService.saveAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    StorageService.saveApiConfig(apiConfig);
  }, [apiConfig]);

  useEffect(() => {
    StorageService.saveSyncLogs(syncLogs);
  }, [syncLogs]);

  useEffect(() => {
    StorageService.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    StorageService.saveLetterhead(letterhead);
  }, [letterhead]);

  // Periodic Auto-Sync simulation if enabled
  useEffect(() => {
    if (!apiConfig.autoSyncEnabled) return;

    const intervalMinutes = apiConfig.syncIntervalMinutes || 30;
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(async () => {
      try {
        const result = await ApiSyncService.performSync(apiConfig, students, attendanceRecords);
        setApiConfig(result.updatedConfig);
        setSyncLogs(StorageService.getSyncLogs());
      } catch (err) {
        console.warn('Auto sync failed:', err);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [apiConfig, students, attendanceRecords]);

  // Total Alpa today for notification badge
  const totalAlpaToday = attendanceRecords.filter(
    r => r.date === todayStr && r.status === 'alpa' && !r.notifiedParent
  ).length;

  // Handlers with automatic cloud database sync
  const handleAddAttendance = useCallback((recordData: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    FirestoreService.saveAttendanceRecord(newRecord).catch(console.warn);
  }, []);

  const handleUpdateStatus = useCallback((recordId: string, newStatus: AttendanceStatus, notes?: string) => {
    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          const updated: AttendanceRecord = {
            ...r,
            status: newStatus,
            notes: notes !== undefined ? notes : r.notes,
            notifiedParent: newStatus !== 'hadir' ? r.notifiedParent : false,
          };
          FirestoreService.saveAttendanceRecord(updated).catch(console.warn);
          return updated;
        }
        return r;
      })
    );
  }, []);

  const handleDeleteRecord = useCallback((recordId: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== recordId));
    FirestoreService.deleteAttendanceRecord(recordId).catch(console.warn);
  }, []);

  const handleClearAllAttendance = useCallback(async () => {
    setAttendanceRecords([]);
    StorageService.saveAttendance([]);
    await FirestoreService.clearAttendanceData().catch(console.warn);
  }, []);

  const handleAddStudent = useCallback((data: Omit<Student, 'id' | 'qrCodeData' | 'createdDate'>) => {
    const newStudent: Student = {
      ...data,
      id: `std-${Date.now()}`,
      qrCodeData: `SMAIT-${data.nis}-${data.nisn}`,
      createdDate: new Date().toISOString().split('T')[0],
    };

    setStudents(prev => [newStudent, ...prev]);
    FirestoreService.saveStudent(newStudent).catch(console.warn);
  }, []);

  const handleUpdateStudent = useCallback((id: string, data: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated: Student = { ...s, ...data };
          if (data.nis || data.nisn) {
            updated.qrCodeData = `SMAIT-${updated.nis}-${updated.nisn}`;
          }
          FirestoreService.saveStudent(updated).catch(console.warn);
          return updated;
        }
        return s;
      })
    );
  }, []);

  const handleDeleteStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setAttendanceRecords(prev => prev.filter(r => r.studentId !== id));
    FirestoreService.deleteStudent(id).catch(console.warn);
  }, []);

  const handleBulkImportStudents = useCallback((imported: Omit<Student, 'id' | 'qrCodeData' | 'createdDate'>[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newStudents: Student[] = imported.map((data, idx) => ({
      ...data,
      id: `std-bulk-${Date.now()}-${idx}`,
      qrCodeData: `SMAIT-${data.nis}-${data.nisn}`,
      createdDate: today,
    }));

    setStudents(prev => [...newStudents, ...prev]);
    newStudents.forEach(st => {
      FirestoreService.saveStudent(st).catch(console.warn);
    });
  }, []);

  const handleAddCategory = useCallback((cat: Omit<AttendanceCategory, 'id'>) => {
    const newCat: AttendanceCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
    FirestoreService.saveCategory(newCat).catch(console.warn);
  }, []);

  const handleUpdateCategory = useCallback((id: string, data: Partial<AttendanceCategory>) => {
    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          FirestoreService.saveCategory(updated).catch(console.warn);
          return updated;
        }
        return c;
      })
    );
  }, []);

  const handleDeleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    FirestoreService.deleteCategory(id).catch(console.warn);
  }, []);

  const handleUpdateLetterhead = useCallback((newConfig: LetterheadConfig) => {
    setLetterhead(newConfig);
    FirestoreService.saveLetterhead(newConfig).catch(console.warn);
  }, []);

  const handleSendSingleWhatsApp = useCallback((record: AttendanceRecord) => {
    const updated: AttendanceRecord = {
      ...record,
      notifiedParent: true,
      parentNotifiedAt: new Date().toLocaleString('id-ID'),
    };
    setAttendanceRecords(prev =>
      prev.map(r => (r.id === record.id ? updated : r))
    );
    FirestoreService.saveAttendanceRecord(updated).catch(console.warn);
  }, []);

  const handleSendBatchWhatsApp = useCallback((records: AttendanceRecord[]) => {
    const ids = new Set(records.map(r => r.id));
    const nowStr = new Date().toLocaleString('id-ID');

    setAttendanceRecords(prev =>
      prev.map(r => {
        if (ids.has(r.id)) {
          const updated: AttendanceRecord = { ...r, notifiedParent: true, parentNotifiedAt: nowStr };
          FirestoreService.saveAttendanceRecord(updated).catch(console.warn);
          return updated;
        }
        return r;
      })
    );

    // Simulate opening bulk notification summary
    alert(`Berhasil mengirimkan ${records.length} pesan pemberitahuan WhatsApp ke seluruh wali siswa.`);
  }, []);

  const handleResetSystemData = useCallback(async () => {
    const seeded = StorageService.resetToDefault();
    setUsers(seeded.users);
    setCurrentUser(seeded.users[0]);
    setCategories(seeded.categories);
    setStudents(seeded.students);
    const newRecords = StorageService.getAttendance();
    setAttendanceRecords(newRecords);
    setLetterhead(seeded.letterhead);
    await FirestoreService.clearAttendanceData().catch(console.warn);
    alert('Sistem berhasil diatur ulang ke data awal SMA IT AL ITTIHAD (data presensi bersih).');
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        apiConfig={apiConfig}
        onOpenScanner={() => setCurrentTab('scanner')}
        onOpenSync={() => setCurrentTab('sync')}
        onLogout={() => setIsLoginModalOpen(true)}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          currentUser={currentUser}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          totalAlpaToday={totalAlpaToday}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              students={students}
              categories={categories}
              attendanceRecords={attendanceRecords}
              currentUser={currentUser}
              onNavigate={(tab) => setCurrentTab(tab)}
              onQuickScan={() => setCurrentTab('scanner')}
              onManualAttendance={() => setIsManualModalOpen(true)}
              onSyncApi={() => setCurrentTab('sync')}
              onSendWhatsApp={handleSendSingleWhatsApp}
              onSelectClassFilter={(cls) => {
                setSelectedClassFilter(cls);
                setCurrentTab('presensi');
              }}
            />
          )}

          {currentTab === 'scanner' && (
            <QrScannerView
              students={students}
              categories={categories.filter(c => c.isActive)}
              attendanceRecords={attendanceRecords}
              onAddAttendance={handleAddAttendance}
              currentUserRole={currentUser.name}
            />
          )}

          {currentTab === 'presensi' && (
            <AttendanceTable
              records={attendanceRecords}
              students={students}
              categories={categories}
              currentUserId={currentUser.name}
              userRole={currentUser.role}
              initialClassFilter={selectedClassFilter}
              onAddRecord={handleAddAttendance}
              onUpdateStatus={handleUpdateStatus}
              onDeleteRecord={handleDeleteRecord}
              onSendWhatsApp={handleSendSingleWhatsApp}
              onClearAttendance={handleClearAllAttendance}
            />
          )}

          {currentTab === 'rekap' && (
            <MonthlyRecapMatrix
              students={students}
              records={attendanceRecords}
              categories={categories}
              letterhead={letterhead}
              onUpdateLetterhead={handleUpdateLetterhead}
            />
          )}

          {currentTab === 'siswa' && (
            <StudentList
              students={students}
              letterhead={letterhead}
              attendanceRecords={attendanceRecords}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkImport={handleBulkImportStudents}
              userRole={currentUser.role}
            />
          )}

          {currentTab === 'kategori' && (
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              userRole={currentUser.role}
            />
          )}

          {currentTab === 'notifikasi' && (
            <ParentNotificationCenter
              students={students}
              records={attendanceRecords}
              categories={categories}
              notifications={notifications}
              onSendBatchNotification={handleSendBatchWhatsApp}
              onSendSingleNotification={handleSendSingleWhatsApp}
            />
          )}

          {currentTab === 'sync' && (
            <ApiConfigView
              config={apiConfig}
              logs={syncLogs}
              students={students}
              attendance={attendanceRecords}
              onSaveConfig={(cfg) => setApiConfig(cfg)}
              onSyncComplete={(cfg) => {
                setApiConfig(cfg);
                setSyncLogs(StorageService.getSyncLogs());
              }}
            />
          )}

          {currentTab === 'akses' && (
            <UserManagement
              users={users}
              currentUser={currentUser}
              onAddUser={(u) => setUsers(prev => [...prev, u])}
              onUpdateUser={(id, data) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))}
              onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
              onResetSystemData={handleResetSystemData}
              onSwitchUser={(u) => setCurrentUser(u)}
              onClearAttendance={handleClearAllAttendance}
            />
          )}
        </main>
      </div>

      {/* Manual Attendance Modal */}
      {isManualModalOpen && (
        <ManualAttendanceModal
          students={students}
          categories={categories.filter(c => c.isActive)}
          currentUserId={currentUser.name}
          onSaveRecord={handleAddAttendance}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}

      {/* Login & Switch User Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        users={users}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setIsLoginModalOpen(false);
        }}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
