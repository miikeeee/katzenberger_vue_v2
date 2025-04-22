import axios from 'axios';

const apiClient = axios.create({
    // Die BaseURL wird normalerweise leer gelassen, wenn man mit
    // Vercel Dev arbeitet, da relative Pfade ('/api/...') funktionieren.
    // baseURL: '/api', // Oder die volle URL, falls nötig
    headers: {
        'Content-Type': 'application/json',
        // Weitere Header nach Bedarf (z.B. Authorization)
    },
});

// Optional: Interceptors hinzufügen (z.B. für Error Handling)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Hier globales Fehlerhandling einbauen, falls gewünscht
        console.error('API call failed:', error);
        return Promise.reject(error);
    }
);

export default apiClient;