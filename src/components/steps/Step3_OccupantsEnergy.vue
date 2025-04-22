<script setup lang="ts">
import { ref, computed } from 'vue';
// Pfad anpassen, falls nötig
import { useAppStore, type EnergySourceType, type CombustionTechType } from '../../stores/appStore';
import { onMounted, onUnmounted } from 'vue'; // Für Popup-Schließ-Logik

// Initialisiere den Store
const appStore = useAppStore();

// --- State und Logik für Info-Popups ---
const activeInfoPopup = ref<string | null>(null); // Speichert den Key des offenen Popups
const infoTexts = {
    occupantsInfo: 'Geben Sie die Anzahl der Personen an, die dauerhaft im Haushalt leben (1 bis 10). Dies beeinflusst den Warmwasserbedarf.',
    energySourceInfo: 'Wählen Sie den Haupt-Energieträger aus, mit dem aktuell die Raumheizung betrieben wird.',
    combustionTechInfo: 'Geben Sie an, ob Ihr Heizkessel die Energie im Wasserdampf der Abgase nutzt (Brennwerttechnik) oder nicht (Heizwerttechnik). Brennwertgeräte sind effizienter. Wenn Sie es nicht wissen, wählen Sie "Weiß ich nicht".'
};

// Funktion zum Öffnen/Schließen eines Popups
const toggleInfoPopup = (field: string) => {
    activeInfoPopup.value = activeInfoPopup.value === field ? null : field;
};

// Funktion, um Popups zu schließen, wenn außerhalb geklickt wird
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // Prüft, ob Klick weder auf Icon noch auf Popup selbst war
    if (!target.closest('.info-icon-button') && !target.closest('.info-popup')) {
        activeInfoPopup.value = null;
    }
};
// Event Listener für Klicks außerhalb registrieren/deregistrieren
onMounted(() => { document.addEventListener('click', handleClickOutside); });
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

// --- Computed Property für Bewohnerzahl (für v-model) ---
// Verbindet das Input-Feld mit der Store-Action inkl. Validierung
const occupants = computed({
  get: () => appStore.formData.occupants,
  set: (value) => appStore.setOccupants(value) // Ruft die setOccupants Action im Store auf
});

// --- Datenstrukturen für Auswahlmöglichkeiten ---

// Optionen für Energieträger
const energyOptions: { key: EnergySourceType; label: string; image: string }[] = [
  { key: 'Öl', label: 'Heizöl', image: '/images/öl.png' },
  { key: 'Gas', label: 'Erdgas', image: '/images/gas.png' },
  { key: 'Wärmepumpe', label: 'Wärmepumpe', image: '/images/wärmepumpe.png' },
  { key: 'Fernwärme', label: 'Fernwärme', image: '/images/fernwärme.png' },
  { key: 'Pellets', label: 'Holzpellets', image: '/images/pellets.png' },
  { key: 'Sonstige', label: 'Sonstige', image: '/images/sonstige.png' },
];

// --- Daten für Heiztechnik-Auswahl - MIT BILDERN ---
const combustionTechOptions: { value: CombustionTechType; label: string; image: string }[] = [
    // WICHTIG: Dateinamen müssen exakt stimmen (Groß-/Kleinschreibung beachten)!
    { value: 'Brennwert', label: 'Brennwerttechnik', image: '/images/brennwert.png' },
    { value: 'Heizwert', label: 'Heizwerttechnik', image: '/images/heizwert.png' },
    // Annahme: Es gibt ein Bild für "Weiß ich nicht", z.B. ein Fragezeichen
    { value: 'Weiß nicht', label: 'Weiß ich nicht', image: '/images/fragezeichen.png' } // Pfad ggf. anpassen
];

// --- Funktionen für Benutzeraktionen ---

// Funktion für Klick auf eine Energieträger-Karte
const selectEnergySource = (source: EnergySourceType) => {
    appStore.selectEnergySource(source); // Ruft die Action im Store auf
};

// Funktion für Auswahl der Heiztechnik (Radio-Button)
const selectCombustionTech = (tech: CombustionTechType) => {
    appStore.setCombustionTechnology(tech); // Ruft die Action im Store auf
};

</script>

<template>
  <div>
    <!-- Titel für Schritt 3 -->
    <h2 class="title is-4 mb-5">3. Bewohner & Heizsystem</h2>

    <!-- Eingabe Bewohnerzahl -->
    <div class="field">
       <!-- Label mit Info-Icon -->
       <div class="label-with-info">
          <label class="label" for="occupants">Wie viele Personen leben im Haushalt?</label>
          <button
              class="button is-small is-info is-outlined is-rounded info-icon-button"
              @click.stop="toggleInfoPopup('occupantsInfo')"
              aria-label="Info zu Personenzahl anzeigen"
          >
              <span class="icon is-small"><i class="fas fa-question"></i></span>
          </button>
          <!-- Info-Popup für Bewohnerzahl -->
          <div v-if="activeInfoPopup === 'occupantsInfo'" class="info-popup notification is-info is-light">
             <button class="delete" @click.stop="toggleInfoPopup('occupantsInfo')"></button>
             {{ infoTexts.occupantsInfo }}
          </div>
       </div>
       <!-- Input-Feld mit Fehleranzeige -->
      <div class="control has-icons-right">
        <input
          id="occupants"
          :class="['input', { 'is-danger': appStore.validationErrors.occupants }]"
          type="number"
          placeholder="z.B. 4"
          min="1"
          max="10"
          step="1"
          v-model.number="occupants"
          aria-describedby="occupantsError"
          :aria-invalid="!!appStore.validationErrors.occupants"
        >
        <!-- Fehler-Icon -->
        <span v-if="appStore.validationErrors.occupants" class="icon is-small is-right has-text-danger">
            <i class="fas fa-exclamation-triangle"></i>
        </span>
      </div>
      <!-- Fehlermeldung -->
      <p v-if="appStore.validationErrors.occupants" class="help is-danger" id="occupantsError">
        {{ appStore.validationErrors.occupants }}
      </p>
    </div>

    <!-- Auswahl Energieträger -->
    <div class="field mt-5">
       <!-- Label mit Info-Icon -->
       <div class="label-with-info">
          <label class="label">Mit welchem Energieträger wird zurzeit geheizt?</label>
           <button
              class="button is-small is-info is-outlined is-rounded info-icon-button"
              @click.stop="toggleInfoPopup('energySourceInfo')"
              aria-label="Info zu Energieträger anzeigen"
           >
              <span class="icon is-small"><i class="fas fa-question"></i></span>
           </button>
           <!-- Info-Popup für Energieträger -->
           <div v-if="activeInfoPopup === 'energySourceInfo'" class="info-popup notification is-info is-light">
               <button class="delete" @click.stop="toggleInfoPopup('energySourceInfo')"></button>
               {{ infoTexts.energySourceInfo }}
           </div>
       </div>
       <!-- Karten für die Auswahl -->
       <div class="columns is-multiline is-mobile is-centered">
           <div
              v-for="option in energyOptions"
              :key="option.key"
              class="column is-one-third-desktop is-half-tablet is-half-mobile"
           >
               <div
                  class="card is-clickable"
                  @click="selectEnergySource(option.key)"
                  :class="{ 'is-selected': appStore.formData.energySource === option.key }"
                  role="radio"
                  :aria-checked="appStore.formData.energySource === option.key"
                  tabindex="0"
                  @keydown.enter="selectEnergySource(option.key)"
                  @keydown.space.prevent="selectEnergySource(option.key)"
               >
                    <div class="card-image has-text-centered pt-4">
                       <figure class="image is-64x64 is-inline-block">
                          <img :src="option.image" :alt="option.label">
                       </figure>
                    </div>
                    <div class="card-content has-text-centered">
                       <p class="energy-label">{{ option.label }}</p>
                    </div>
               </div>
           </div>
       </div>
        <!-- Fehlermeldung für Energieträger -->
        <p v-if="appStore.validationErrors.energySource" class="help is-danger mt-3" id="energySourceError">
           {{ appStore.validationErrors.energySource }}
        </p>
    </div>

    <!-- Auswahl Heiztechnik (Brennwert/Heizwert) - JETZT MIT KARTEN -->
    <div class="field mt-5" v-if="appStore.isCombustionTechRelevant">
        <!-- Label mit Info-Icon (bleibt gleich) -->
        <div class="label-with-info">
          <label class="label">Welche Heiztechnik wird verwendet?</label>
          <button class="button is-small is-info is-outlined is-rounded info-icon-button" @click.stop="toggleInfoPopup('combustionTechInfo')" aria-label="Info zu Heiztechnik anzeigen">...</button>
           <div v-if="activeInfoPopup === 'combustionTechInfo'" class="info-popup notification is-info is-light">...</div>
       </div>
       <!-- Karten für die Auswahl -->
       <div class="columns is-multiline is-mobile is-centered">
           <div
              v-for="option in combustionTechOptions"
              :key="option.value"
              class="column is-one-third-desktop is-half-tablet is-full-mobile"
           >
               <div
                  class="card is-clickable"
                  @click="selectCombustionTech(option.value)"
                  :class="{ 'is-selected': appStore.formData.combustionTechnology === option.value }"
                  role="radio"
                  :aria-checked="appStore.formData.combustionTechnology === option.value"
                  tabindex="0"
                  @keydown.enter="selectCombustionTech(option.value)"
                  @keydown.space.prevent="selectCombustionTech(option.value)"
               >
                    <div class="card-image has-text-centered pt-4">
                       <figure class="image is-64x64 is-inline-block">
                          <!-- Bildquelle aus den Optionen -->
                          <img :src="option.image" :alt="option.label">
                       </figure>
                    </div>
                    <div class="card-content has-text-centered">
                       <!-- Label aus den Optionen -->
                       <p class="combustion-tech-label">{{ option.label }}</p>
                    </div>
               </div>
           </div>
       </div>
       <!-- Fehlermeldung für Heiztechnik -->
        <p v-if="appStore.validationErrors.combustionTechnology" class="help is-danger mt-3" id="combustionTechError">
           {{ appStore.validationErrors.combustionTechnology }}
        </p>
    </div>

  </div>
</template>

<style scoped>
/* --- Stile für Auswahlkarten (wiederverwendet) --- */
.card.is-clickable {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
  border: 2px solid transparent;
  background-color: #fff;
  border: 1px solid #dbdbdb;
  height: 100%; /* Sorgt für gleiche Höhe in einer Reihe */
  display: flex; /* Hilft bei der Zentrierung des Inhalts */
  flex-direction: column;
  justify-content: center; /* Zentriert Inhalt vertikal */
}
.card.is-clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}
.card.is-selected {
  border-color: #3273dc; /* Bulma Info Farbe */
  box-shadow: 0 0 0 1px #3273dc;
  background-color: hsl(204, 86%, 96%); /* Helles Info-Background */
}
.card-content {
    padding: 0.75rem;
    flex-grow: 1; /* Erlaubt dem Content zu wachsen */
    display: flex;
    align-items: center; /* Zentriert Text vertikal im Content-Bereich */
    justify-content: center;
}
.energy-label {
    font-size: 0.9rem;
    font-weight: 600;
}
.card-image {
    padding-top: 1rem; /* Etwas Abstand oben für das Bild */
}
.card-image img {
    max-width: 100%;
    height: auto;
    max-height: 64px; /* Verhindert zu große Bilder */
}

/* --- Stile für Label mit Info-Icon und Popup (wiederverwendet) --- */
.label-with-info {
    display: flex;
    align-items: center;
    position: relative; /* Wichtig für das Popup */
    margin-bottom: 0.5rem; /* Abstand zum Input-Feld oder Karten */
    flex-wrap: wrap; /* Erlaubt Umbruch bei schmalen Screens */
}
.label-with-info .label {
    margin-bottom: 0 !important; /* Bulma default margin entfernen */
    margin-right: 0.5rem; /* Abstand zum Icon */
    line-height: 1.5; /* Verbessert Ausrichtung mit Icon-Button */
}
.info-icon-button {
    padding: 0.2em 0.5em; /* Kleineres Padding */
    height: 1.5em; /* Kleinere Höhe, passend zur Zeilenhöhe */
    line-height: 1; /* Zentriert Icon vertikal */
    align-self: center; /* Stellt sicher, dass Button mittig zum Label ist */
}
.info-popup {
    position: absolute;
    top: 100%; /* Unterhalb des Labels/Icons positionieren */
    left: 1.5rem; /* Leicht eingerückt vom Label-Start */
    z-index: 20; /* Über anderen Elementen */
    width: 300px; /* Breite des Popups */
    max-width: 90vw; /* Maximale Breite auf kleinen Screens */
    margin-top: 0.5rem; /* Kleiner Abstand nach unten */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    /* Style von .notification is-info is-light wird angewendet */
    padding: 0.75rem 1rem !important; /* Padding anpassen */
}
.info-popup .delete {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}

/* --- Stile für Input-Felder und Fehler --- */
.control.has-icons-right .input.is-danger ~ .icon {
    /* Stellt sicher, dass das Icon korrekt positioniert ist */
    right: 0.25em; /* Ggf. anpassen */
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none; /* Nicht klickbar */
}
.help.is-danger {
     margin-top: 0.25rem;
     font-size: 0.875rem; /* Etwas kleiner */
}

/* --- Stile für Radio-Buttons --- */
.control .radio {
    margin-right: 1em;
    cursor: pointer;
    padding: 0.3em 0;
    display: inline-flex; /* Verbessert Ausrichtung */
    align-items: center;
}
.control .radio:last-child {
    margin-right: 0;
}
.radio input[type="radio"] {
    margin-right: 0.3em;
    cursor: pointer;
}
/* Hervorhebung für das Label des ausgewählten Radio-Buttons */
.is-selected-radio {
    font-weight: bold;
    color: #3273dc; /* Passend zur Auswahlfarbe */
}

/* --- Responsive Anpassungen --- */
/* Stellt sicher, dass auf Mobilgeräten 2 Karten pro Zeile angezeigt werden */
.columns.is-mobile > .column.is-half-mobile {
    flex: none;
    width: 50%;
}
</style>