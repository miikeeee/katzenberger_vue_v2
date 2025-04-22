<script setup lang="ts">
import { ref, computed } from 'vue';
// Pfad anpassen, falls nötig
import { useAppStore, type BuildingType } from '../../stores/appStore';
import { onMounted, onUnmounted } from 'vue'; // Für Popup-Schließ-Logik

// Initialisiere den Store
const appStore = useAppStore();

// --- State und Logik für Info-Popups ---
const activeInfoPopup = ref<string | null>(null); // Speichert den Key des offenen Popups
const infoTexts = {
    buildingType: 'Wählen Sie den passenden Gebäudetyp aus. Dies beeinflusst Standardannahmen für die Berechnung.',
    constructionYear: `Geben Sie das Baujahr des Gebäudes an (zwischen 1850 und ${appStore.currentYear}). Es wird zur Abschätzung von U-Werten verwendet, falls keine genauen Werte bekannt sind.`,
    heatedArea: 'Geben Sie die gesamte beheizte Wohn- oder Nutzfläche in Quadratmetern an (zwischen 70 und 400 m²).'
};

// Funktion zum Öffnen/Schließen eines Popups
const toggleInfoPopup = (field: string) => {
    activeInfoPopup.value = activeInfoPopup.value === field ? null : field;
};

// Funktion, um Popups zu schließen, wenn außerhalb geklickt wird
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.info-icon-button') && !target.closest('.info-popup')) {
        activeInfoPopup.value = null;
    }
};
// Event Listener für Klicks außerhalb registrieren/deregistrieren
onMounted(() => { document.addEventListener('click', handleClickOutside); });
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

// --- Computed Properties für v-model ---
// Verbinden das Input-Feld mit der Store-Action inkl. Validierung
const constructionYear = computed({
  get: () => appStore.formData.constructionYear,
  set: (value) => appStore.setConstructionYear(value) // Ruft die Action im Store auf
});
const heatedArea = computed({
  get: () => appStore.formData.heatedArea,
  set: (value) => appStore.setHeatedArea(value) // Ruft die Action im Store auf
});

// --- Datenstrukturen für Auswahlmöglichkeiten ---
const buildingTypes: { type: BuildingType; label: string; image: string }[] = [
  { type: 'EFH', label: 'Einfamilienhaus', image: '/images/efh.png' },
  { type: 'ZFH', label: 'Zweifamilienhaus', image: '/images/zfh.png' },
  { type: 'MFH', label: 'Mehrfamilienhaus', image: '/images/mfh.png' },
];

// --- Funktionen für Benutzeraktionen ---
const selectBuildingType = (type: BuildingType) => {
    appStore.updateFormData({ buildingType: type }); // Ruft nur noch updateFormData auf
};

</script>

<template>
  <div>
    <!-- Titel für Schritt 1 -->
    <h2 class="title is-4 mb-5">1. Allgemeine Projektdaten</h2>

    <!-- Auswahl Gebäudetyp -->
    <div class="field mb-5">
      <!-- Label mit Info-Icon -->
      <div class="label-with-info">
        <label class="label">Welche Gebäudeart wird betrachtet?</label>
        <button
            class="button is-small is-info is-outlined is-rounded info-icon-button"
            @click.stop="toggleInfoPopup('buildingType')"
            aria-label="Info zu Gebäudeart anzeigen"
        >
            <span class="icon is-small"><i class="fas fa-question"></i></span>
        </button>
        <!-- Info-Popup für Gebäudeart -->
        <div v-if="activeInfoPopup === 'buildingType'" class="info-popup notification is-info is-light">
            <button class="delete" @click.stop="toggleInfoPopup('buildingType')"></button>
            {{ infoTexts.buildingType }}
        </div>
      </div>
      <!-- Karten für die Auswahl -->
      <div class="columns is-centered is-multiline">
        <div
          v-for="btype in buildingTypes" :key="btype.type"
          class="column is-one-third-desktop is-half-tablet is-full-mobile"
        >
          <div
            class="card is-clickable"
            @click="selectBuildingType(btype.type)"
            :class="{ 'is-selected': appStore.formData.buildingType === btype.type }"
            role="radio" :aria-checked="appStore.formData.buildingType === btype.type" tabindex="0"
            @keydown.enter="selectBuildingType(btype.type)"
            @keydown.space.prevent="selectBuildingType(btype.type)"
          >
            <div class="card-image has-text-centered pt-4">
              <figure class="image is-64x64 is-inline-block">
                <img :src="btype.image" :alt="btype.label">
              </figure>
            </div>
            <div class="card-content has-text-centered">
              <p class="building-type-label">{{ btype.label }}</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Hier kein expliziter Fehlertext für Gebäudetyp, da Button deaktiviert ist -->
    </div>

    <!-- Eingabe Baujahr -->
    <div class="field">
       <!-- Label mit Info-Icon -->
       <div class="label-with-info">
          <label class="label" for="constructionYear">Baujahr des Gebäudes</label>
          <button
              class="button is-small is-info is-outlined is-rounded info-icon-button"
              @click.stop="toggleInfoPopup('constructionYear')"
              aria-label="Info zu Baujahr anzeigen"
          >
              <span class="icon is-small"><i class="fas fa-question"></i></span>
          </button>
          <!-- Info-Popup für Baujahr -->
          <div v-if="activeInfoPopup === 'constructionYear'" class="info-popup notification is-info is-light">
             <button class="delete" @click.stop="toggleInfoPopup('constructionYear')"></button>
             {{ infoTexts.constructionYear }}
          </div>
       </div>
       <!-- Input-Feld mit Fehleranzeige -->
      <div class="control has-icons-right">
        <input
          id="constructionYear"
          :class="['input', { 'is-danger': !!appStore.validationErrors.constructionYear }]"
          type="number"
          :placeholder="`z.B. 1985 (min. 1850, max. ${appStore.currentYear})`"
          :min="1850"
          :max="appStore.currentYear"
          v-model.number="constructionYear"
          aria-describedby="constructionYearError"
          aria-invalid="!!appStore.validationErrors.constructionYear"
        >
        <!-- Fehler-Icon -->
        <span v-if="!!appStore.validationErrors.constructionYear" class="icon is-small is-right has-text-danger">
            <i class="fas fa-exclamation-triangle"></i>
        </span>
      </div>
      <!-- Fehlermeldung -->
      <p v-if="appStore.validationErrors.constructionYear" class="help is-danger" id="constructionYearError">
        {{ appStore.validationErrors.constructionYear }}
      </p>
    </div>

    <!-- Eingabe Beheizbare Fläche -->
    <div class="field mt-4"> <!-- Kleiner Abstand hinzugefügt -->
       <!-- Label mit Info-Icon -->
        <div class="label-with-info">
          <label class="label" for="heatedArea">Beheizbare Fläche (in m²)</label>
           <button
              class="button is-small is-info is-outlined is-rounded info-icon-button"
              @click.stop="toggleInfoPopup('heatedArea')"
              aria-label="Info zu beheizbarer Fläche anzeigen"
           >
              <span class="icon is-small"><i class="fas fa-question"></i></span>
           </button>
           <!-- Info-Popup für Fläche -->
           <div v-if="activeInfoPopup === 'heatedArea'" class="info-popup notification is-info is-light">
               <button class="delete" @click.stop="toggleInfoPopup('heatedArea')"></button>
               {{ infoTexts.heatedArea }}
           </div>
        </div>
        <!-- Input-Feld mit Fehleranzeige -->
      <div class="control has-icons-right">
        <input
          id="heatedArea"
          :class="['input', { 'is-danger': !!appStore.validationErrors.heatedArea }]"
          type="number"
          placeholder="z.B. 150 (min. 70, max. 400)"
          min="70" max="400" step="0.1"
          v-model.number="heatedArea"
          aria-describedby="heatedAreaError"
          aria-invalid="!!appStore.validationErrors.heatedArea"
        >
         <!-- Fehler-Icon -->
        <span v-if="!!appStore.validationErrors.heatedArea" class="icon is-small is-right has-text-danger">
            <i class="fas fa-exclamation-triangle"></i>
        </span>
      </div>
       <!-- Fehlermeldung -->
      <p v-if="appStore.validationErrors.heatedArea" class="help is-danger" id="heatedAreaError">
        {{ appStore.validationErrors.heatedArea }}
      </p>
    </div>

  </div>
</template>

<style scoped>
/* --- Stile für Auswahlkarten --- */
.card.is-clickable {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
  border: 2px solid transparent;
  background-color: #fff;
  border: 1px solid #dbdbdb;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.card.is-clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}
.card.is-selected {
  border-color: #3273dc;
  box-shadow: 0 0 0 1px #3273dc;
  background-color: hsl(204, 86%, 96%);
}
.card-content {
    padding: 0.75rem;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
.building-type-label { /* Eigene Klasse, falls spezifisches Styling nötig */
    font-size: 0.9rem;
    font-weight: 600;
}
.card-image {
    padding-top: 1rem;
}
.card-image img {
    max-width: 100%;
    height: auto;
    max-height: 64px;
}

/* --- Stile für Label mit Info-Icon und Popup --- */
.label-with-info {
    display: flex;
    align-items: center;
    position: relative;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}
.label-with-info .label {
    margin-bottom: 0 !important;
    margin-right: 0.5rem;
    line-height: 1.5;
}
.info-icon-button {
    padding: 0.2em 0.5em;
    height: 1.5em;
    line-height: 1;
    align-self: center;
}
.info-popup {
    position: absolute;
    top: 100%;
    left: 1.5rem;
    z-index: 20;
    width: 300px;
    max-width: 90vw;
    margin-top: 0.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    padding: 0.75rem 1rem !important;
}
.info-popup .delete {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}

/* --- Stile für Input-Felder und Fehler --- */
/* Stellt sicher, dass Icon im Control ist und nicht den Text überlagert */
.control.has-icons-right .input {
    padding-right: 2.5em; /* Platz für Icon */
}
.control.has-icons-right .icon.is-right {
    right: 0; /* Standard Bulma Position */
    pointer-events: none; /* Icon nicht klickbar */
}
.help.is-danger {
     margin-top: 0.25rem;
     font-size: 0.875rem;
}
</style>