import { User, Course, Booking, AdminSettings } from '../types';

// CONFIGURATION
// If true, we skip the server and only use LocalStorage.
// If false, we TRY the server, and fall back to LocalStorage if server is down.
const FORCE_MOCK_ONLY = false; 
const API_URL = 'http://localhost:3001/api';

// --- KEYS & DEFAULTS ---
const USERS_KEY = 'opslearn_users';
const COURSES_KEY = 'opslearn_courses';
const BOOKINGS_KEY = 'opslearn_bookings';
const ADMIN_SETTINGS_KEY = 'opslearn_admin_settings';

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Chen', role: 'Engineer', avatar: 'https://picsum.photos/id/64/100/100' },
  { id: 'u2', name: 'Bob Smith', role: 'Engineer', avatar: 'https://picsum.photos/id/65/100/100' },
  { id: 'u3', name: 'Charlie Kim', role: 'Lead', avatar: 'https://picsum.photos/id/66/100/100' },
  { id: 'u4', name: 'David Lee', role: 'Engineer', avatar: 'https://picsum.photos/id/67/100/100' },
];

const MOCK_COURSES: Course[] = [
  { 
    id: 'c1', 
    title: 'Kubernetes in 100 Seconds', 
    description: 'A quick, high-level overview of Kubernetes architecture and concepts.',
    url: 'https://www.youtube.com/watch?v=lxxyY5e_h2o', 
    durationMinutes: 15,
    createdBy: 'u3',
    tags: ['K8s', 'DevOps', 'Cloud'],
    quiz: {
        questions: [
            { id: 'q1', text: 'What is the smallest deployable unit in K8s?', options: ['Node', 'Pod', 'Container', 'Cluster'], correctAnswerIndex: 1 },
            { id: 'q2', text: 'Which component manages the cluster?', options: ['Worker Node', 'Control Plane', 'Kubelet', 'Proxy'], correctAnswerIndex: 1 }
        ]
    }
  },
  { 
    id: 'c2', 
    title: 'React in 100 Seconds', 
    description: 'Understand the core concepts of React: Components, State, and Props.',
    url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', 
    durationMinutes: 15,
    createdBy: 'u1',
    tags: ['Frontend', 'React', 'JS']
  },
  { 
    id: 'c3', 
    title: 'Site Reliability Engineering in 100 Seconds', 
    description: 'What is SRE? Key concepts like SLIs, SLOs, and Error Budgets explained.',
    url: 'https://www.youtube.com/watch?v=BrFE-9K4hHg', 
    durationMinutes: 15,
    createdBy: 'u2',
    tags: ['Ops', 'SRE', 'Process']
  },
  { 
    id: 'c4', 
    title: 'WebSockets in 100 Seconds', 
    description: 'Learn how WebSockets enable real-time, bidirectional communication between clients and servers.',
    url: 'https://www.youtube.com/watch?v=UBUNrFtufWo', 
    durationMinutes: 15,
    createdBy: 'u3',
    tags: ['Web', 'Network', 'Realtime']
  }
];

// Helper: Fix legacy/broken data in LocalStorage if it exists
const ensureDataIntegrity = () => {
    try {
        const storedCourses = localStorage.getItem(COURSES_KEY);
        if (storedCourses) {
            const parsed: Course[] = JSON.parse(storedCourses);
            let needsUpdate = false;
            
            // Known safe URLs to enforce for default courses
            const SAFE_URLS: Record<string, string> = {
                'c1': 'https://www.youtube.com/watch?v=lxxyY5e_h2o',
                'c2': 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
                'c3': 'https://www.youtube.com/watch?v=BrFE-9K4hHg',
                'c4': 'https://www.youtube.com/watch?v=UBUNrFtufWo'
            };

            const fixed = parsed.map(c => {
                // If it's one of our default courses, force the URL to be safe
                if (SAFE_URLS[c.id] && c.url !== SAFE_URLS[c.id]) {
                    console.log(`Fixing broken video URL for course ${c.id}`);
                    needsUpdate = true;
                    return { ...c, url: SAFE_URLS[c.id] };
                }
                // Also catch the specific old broken K8s video if it somehow has a different ID
                if (c.url.includes('W_3Qu53C6oM')) { 
                    needsUpdate = true;
                    return { ...c, title: 'Kubernetes in 100 Seconds', url: 'https://www.youtube.com/watch?v=lxxyY5e_h2o', durationMinutes: 15 };
                }
                return c;
            });
            
            if (needsUpdate) {
                console.log('Applying data integrity fixes to LocalStorage...');
                localStorage.setItem(COURSES_KEY, JSON.stringify(fixed));
            }
        }
    } catch (e) {
        console.error("Migration error", e);
    }
};

// Run migration once on module load
ensureDataIntegrity();

// Helper: Hybrid Fetcher
// Tries API first. If error, falls back to LocalStorage logic.
async function hybridFetch<T>(
    endpoint: string, 
    localKey: string, 
    defaultData: T
): Promise<T> {
    if (!FORCE_MOCK_ONLY) {
        try {
            const res = await fetch(`${API_URL}${endpoint}`);
            if (!res.ok) throw new Error('Server returned ' + res.status);
            return await res.json();
        } catch (e) {
            console.warn(`Server unavailable (${endpoint}), falling back to local storage.`);
        }
    }
    
    // Fallback Logic
    const stored = localStorage.getItem(localKey);
    if (!stored) {
        localStorage.setItem(localKey, JSON.stringify(defaultData));
        return defaultData;
    }
    return JSON.parse(stored);
}

async function hybridPost<T>(
    endpoint: string,
    localKey: string,
    newItem: T,
    currentList: T[]
): Promise<void> {
    // Optimistic Local Update first
    const updatedList = [...currentList, newItem];
    localStorage.setItem(localKey, JSON.stringify(updatedList));

    if (!FORCE_MOCK_ONLY) {
        try {
            await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newItem)
            });
        } catch (e) {
            console.warn(`Server unavailable, saved locally only.`);
        }
    }
}

async function hybridDelete<T extends { id: string }>(
    endpoint: string,
    localKey: string,
    id: string,
    currentList: T[]
): Promise<void> {
    // Optimistic Local Update
    const updatedList = currentList.filter(item => item.id !== id);
    localStorage.setItem(localKey, JSON.stringify(updatedList));

    if (!FORCE_MOCK_ONLY) {
        try {
            await fetch(`${API_URL}${endpoint}/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.warn(`Server unavailable, deleted locally only.`);
        }
    }
}


export const storageService = {
  getUsers: async (): Promise<User[]> => {
    return hybridFetch('/users', USERS_KEY, MOCK_USERS);
  },

  getCourses: async (): Promise<Course[]> => {
    return hybridFetch('/courses', COURSES_KEY, MOCK_COURSES);
  },

  addCourse: async (course: Course): Promise<void> => {
    const current = await storageService.getCourses();
    return hybridPost('/courses', COURSES_KEY, course, current);
  },

  getBookings: async (): Promise<Booking[]> => {
    return hybridFetch('/bookings', BOOKINGS_KEY, []);
  },

  addBooking: async (booking: Booking): Promise<void> => {
    const current = await storageService.getBookings();
    return hybridPost('/bookings', BOOKINGS_KEY, booking, current);
  },

  deleteBooking: async (bookingId: string): Promise<void> => {
    const current = await storageService.getBookings();
    return hybridDelete('/bookings', BOOKINGS_KEY, bookingId, current);
  },

  getAdminSettings: async (): Promise<AdminSettings> => {
    return hybridFetch('/admin/settings', ADMIN_SETTINGS_KEY, { oauthUrl: '' });
  },

  saveAdminSettings: async (settings: AdminSettings): Promise<void> => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    if (!FORCE_MOCK_ONLY) {
        try {
            await fetch(`${API_URL}/admin/settings`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(settings)
            });
        } catch (e) { console.warn('Saved settings locally only'); }
    }
  },
  
  reset: () => {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(COURSES_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
    localStorage.removeItem(ADMIN_SETTINGS_KEY);
  }
};