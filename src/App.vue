<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue';
import { useAppStore } from './stores/appStore';

// Initialisiere den Pinia Store
const appStore = useAppStore();

// Asynchrone Definition der Komponenten für jeden Schritt (Code Splitting)
const steps = {
  1: defineAsyncComponent(() => import('././components/steps/Step1_ProjectData.vue')),
  2: defineAsyncComponent(() => import('./components/steps/Step2_Renovations.vue')),
  3: defineAsyncComponent(() => import('./components/steps/Step3_OccupantsEnergy.vue')),
  // --- Fügen Sie hier Imports für weitere Schritt-Komponenten hinzu ---
  // Beispiel für Schritt 4 (Platzhalter erstellen oder korrekten Pfad angeben)
  //4: defineAsyncComponent(() => import('./components/steps/Step4_HeatingSystem.vue')),
  // 5: defineAsyncComponent(() => import('./components/steps/Step5_Summary.vue')),
  // 6: defineAsyncComponent(() => import('./components/steps/Step6_Results.vue')),
};

// Bestimme die höchste Schrittnummer aus den definierten Schritten
const stepKeys = computed(() => Object.keys(steps).map(Number));
const lastStepKey = computed(() => Math.max(0, ...stepKeys.value)); // Verwende 0 als Fallback, falls steps leer ist
const totalSteps = computed(() => lastStepKey.value); // Gesamtzahl der Eingabeschritte

// Bestimmt die Komponente, die für den aktuellen Schritt angezeigt werden soll
const currentStepComponent = computed(() => {
  const stepId = appStore.currentStepId;
  // @ts-ignore - TypeScript kann den dynamischen Index nicht immer sicher auflösen
  return steps[stepId] || null; // Fallback, falls der Schritt nicht definiert ist
});

// Überprüft, ob der aktuelle Schritt gültig ist (alle notwendigen Daten vorhanden und korrekt)
const isCurrentStepValid = computed(() => {
    const stepId = appStore.currentStepId;
    if (stepId === 1) {
        return appStore.isStep1DataComplete;
    } else if (stepId === 2) {
        return appStore.isStep2DataComplete;
    } else if (stepId === 3) {
        return appStore.isStep3DataComplete;
    }
    // --- Fügen Sie hier die Prüfung für weitere Schritte hinzu ---
    // else if (stepId === 4) {
    //     return appStore.isStep4DataComplete; // Beispiel: Getter muss im Store existieren
    // }
    // --- Ende der Erweiterungen ---
    return false; // Standardmäßig ungültig
});

// Funktion, die beim Klick auf den "Weiter"- oder "Berechnen"-Button ausgeführt wird
function handleNext() {
  // 1. Prüfen, ob der aktuelle Schritt gültig ist
  if (!isCurrentStepValid.value) {
      console.warn(`Versuch, von Schritt ${appStore.currentStepId} weiterzugehen, obwohl ungültig.`);
      // HINWEIS: Das Setzen von Fehlern passiert idealerweise direkt bei der Eingabe im Store/Komponente.
      // Hier könnte man höchstens einen allgemeinen Hinweis geben oder Fokus setzen.
      return; // Verhindert das Navigieren
  }
  // Wenn hier angekommen, ist der Schritt gültig.

  // 2. Navigiere zum nächsten Schritt oder löse Berechnung aus
  const currentId = Number(appStore.currentStepId);
  const nextId = currentId + 1;

  // @ts-ignore
  if (steps[nextId]) {
    appStore.nextStep(nextId); // Navigiere zum nächsten Schritt
  } else {
    // Wenn kein nächster Schritt definiert ist, sind wir am Ende der Eingabe angelangt
    console.log("Letzter definierter Eingabeschritt erreicht. Berechnungslogik wird ausgelöst.");
    triggerCalculation(); // Berechnung starten
  }
}

// Funktion, die beim Klick auf den "Zurück"-Button ausgeführt wird
function handlePrevious() {
  appStore.previousStep(); // Navigiere zum vorherigen Schritt via Store Action
}

// Beispiel-Funktion zum Auslösen der Berechnung (asynchron)
async function triggerCalculation() {
    console.log("Starte Heizlastberechnung mit Daten:", JSON.parse(JSON.stringify(appStore.formData))); // Tiefe Kopie für Log
    appStore.uploadError = null; // Alten Fehler löschen
    appStore.isUploading = true; // Zeige Ladezustand an
    try {
        // --- HIER API CALL EINFÜGEN ---
        // z.B.: const response = await apiClient.post('/api/calculate', appStore.formData);
        // appStore.setCalculatedResult(response.data);

        // Simulierter Call für Testzwecke:
        await new Promise(resolve => setTimeout(resolve, 1500)); // Warte 1.5 Sek.
        // Simuliertes Ergebnis
        const dummyResult = {
            heizlastGesamt: Math.round((appStore.formData.heatedArea ?? 100) * 75 * ((appStore.formData.constructionYear ?? 2000) < 1980 ? 1.2 : 1)), // ?? Operator für null-Werte
            raumweise: [{ raum: "Wohnzimmer", last: 1200 }, { raum: "Küche", last: 800 }],
            empfehlung: "Basierend auf Ihren Angaben empfehlen wir...",
            eingabenPruefung: appStore.formData, // Eingaben zur Kontrolle
        };
        appStore.setCalculatedResult(dummyResult); // Ergebnis im Store speichern

    } catch (error: any) {
        console.error("Fehler bei der Heizlastberechnung:", error);
        // Fehler im Store setzen, um ihn anzuzeigen
        appStore.uploadError = error.response?.data?.message || error.message || "Unbekannter Fehler bei der Berechnung.";
        appStore.setCalculatedResult(null); // Kein Ergebnis bei Fehler
    } finally {
        appStore.isUploading = false; // Ladezustand beenden
    }
}


// Beobachtet Änderungen der Schritt-ID, um bei jedem Schrittwechsel zum Seitenanfang zu scrollen
watch(() => appStore.currentStepId, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Sanftes Scrollen
});

</script>

<template>
  <section class="section">
    <div class="container">
      <!-- Hauptüberschrift -->
      <h1 class="title has-text-centered">Heizlastrechner</h1>

      <!-- Fortschrittsanzeige (nur wenn kein Ergebnis) -->
       <div class="box mb-5 progress-box" v-if="!appStore.calculatedResult">
          <label class="label">Fortschritt (Schritt {{ appStore.currentStepId }} von {{ totalSteps }})</label>
          <progress
              class="progress is-info"
              :value="appStore.currentStepId"
              :max="totalSteps"
              aria-label="Fortschritt des Rechners"
              aria-valuemin="1"
              :aria-valuenow="Number(appStore.currentStepId)"
              :aria-valuemax="totalSteps"
          >
              {{ Math.round((Number(appStore.currentStepId) / totalSteps) * 100) }}%
          </progress>
       </div>


      <!-- Container für Schritt-Inhalt (nur wenn kein Ergebnis) -->
      <div class="box content-box" v-if="!appStore.calculatedResult">
        <!-- Ladeanzeige während Berechnung -->
        <div v-if="appStore.isUploading" class="has-text-centered p-5">
            <p class="is-size-5">Berechnung läuft...</p>
            <progress class="progress is-small is-info mt-4" max="100"></progress>
        </div>
         <!-- Anzeige des Schritts (wenn nicht geladen wird) -->
        <div v-else>
            <div v-if="currentStepComponent">
               <keep-alive>
                   <component :is="currentStepComponent" />
               </keep-alive>
            </div>
            <!-- Fallback-Anzeige -->
            <div v-else class="notification is-warning">
                <p v-if="Number(appStore.currentStepId) > totalSteps">Alle Schritte abgeschlossen.</p>
                <p v-else>Schritt {{ appStore.currentStepId }} konnte nicht geladen werden.</p>
            </div>
        </div>
        <!-- Anzeige für Berechnungsfehler -->
         <div v-if="appStore.uploadError && !appStore.isUploading" class="notification is-danger mt-4">
           <button class="delete" @click="appStore.uploadError = null"></button>
           <strong>Fehler bei der Berechnung:</strong><br>
           {{ appStore.uploadError }}
         </div>
      </div>

      <!-- Navigationsbuttons (nur wenn kein Ergebnis) -->
      <div class="buttons is-centered mt-5 navigation-buttons" v-if="!appStore.calculatedResult">
        <!-- Zurück-Button -->
        <button
          class="button is-light"
          @click="handlePrevious"
          :disabled="!appStore.previousStepExists || appStore.isUploading"
          aria-label="Zum vorherigen Schritt"
          >
          <span class="icon is-small"><i class="fas fa-arrow-left" aria-hidden="true"></i></span>
          <span>Zurück</span>
        </button>

        <!-- Weiter-Button (bis zum letzten Schritt) -->
        <button
          v-if="Number(appStore.currentStepId) < totalSteps"
          class="button is-link"
          :class="{ 'is-loading': appStore.isUploading }"
          @click="handleNext"
          :disabled="!isCurrentStepValid || appStore.isUploading"
          aria-label="Zum nächsten Schritt"
          >
          <span>Weiter</span>
           <span class="icon is-small"><i class="fas fa-arrow-right" aria-hidden="true"></i></span>
        </button>

         <!-- Berechnen-Button (im letzten Schritt) -->
         <button
           v-if="Number(appStore.currentStepId) === totalSteps"
           class="button is-success"
           :class="{ 'is-loading': appStore.isUploading }"
           @click="handleNext" <!-- Ruft handleNext auf, das dann triggerCalculation auslöst -->
           :disabled="!isCurrentStepValid || appStore.isUploading"
           aria-label="Heizlast berechnen"
         >
           <span class="icon is-small"><i class="fas fa-calculator" aria-hidden="true"></i></span>
           <span>Berechnen</span>
         </button>
      </div>

       <!-- Ergebnis-Anzeige (wenn Ergebnis vorhanden) -->
       <div v-if="appStore.calculatedResult" class="mt-5 notification is-success result-box">
          <h2 class="subtitle">Berechnungsergebnis:</h2>
          <!-- Hier Ergebnis schön formatieren statt nur JSON -->
          <pre>{{ JSON.stringify(appStore.calculatedResult, null, 2) }}</pre>
           <button class="button is-light mt-4" @click="appStore.resetStore()" aria-label="Neue Berechnung starten">
               <span class="icon is-small"><i class="fas fa-redo" aria-hidden="true"></i></span>
               <span>Neue Berechnung</span>
           </button>
       </div>

    </div> <!-- Ende .container -->
  </section> <!-- Ende .section -->
</template>

<style>
/* Globale Styles oder Anpassungen für Bulma hier */
.section {
  padding-top: 2rem;
  padding-bottom: 4rem;
  min-height: 100vh;
}
.progress-box, .content-box, .result-box {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.navigation-buttons .button {
  min-width: 120px;
}
.result-box pre {
  background-color: rgba(255, 255, 255, 0.8);
  color: #363636;
  padding: 1em;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.content-box .progress.is-small {
    height: 5px;
}
</style>