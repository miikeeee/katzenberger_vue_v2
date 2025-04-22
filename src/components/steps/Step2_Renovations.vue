<script setup lang="ts">
import { ref } from 'vue';
// Pfad zum Store anpassen, falls nötig
import { useAppStore, type RenovationPart } from '../../stores/appStore';

const appStore = useAppStore();

// --- Logik für Info-Popup ---
const activeInfoPopup = ref<string | null>(null);
const infoText = 'Wählen Sie aus, welche größeren Sanierungsmaßnahmen (relevant für die Gebäudehülle) bereits durchgeführt wurden. Mehrfachauswahl ist möglich. Wenn keine dieser Maßnahmen erfolgte, wählen Sie "Keine".';

const toggleInfoPopup = () => {
    activeInfoPopup.value = activeInfoPopup.value ? null : 'renovationsInfo';
};

// Daten für die Auswahlmöglichkeiten
const renovationOptions: { key: RenovationPart; label: string; image: string }[] = [
  { key: 'Dach', label: 'Dach', image: '/images/dach.png' },
  { key: 'Fassade', label: 'Fassade', image: '/images/fassade.png' },
  { key: 'Fenster', label: 'Fenster', image: '/images/fenster.png' },
  { key: 'Keine', label: 'Keine', image: '/images/keine.png' }, // Bild für "Keine"? Ggf. ein X oder leeres Haus
];

// Funktion für Klick auf eine Karte
const selectRenovation = (part: RenovationPart) => {
    appStore.toggleRenovation(part);
};

</script>

<template>
  <div>
    <div class="label-with-info mb-5">
      <h2 class="title is-4 is-inline-block mr-2">2. Durchgeführte Sanierungen</h2>
      <button
        class="button is-small is-info is-outlined is-rounded info-icon-button"
        @click.stop="toggleInfoPopup"
        aria-label="Info zu Sanierungen anzeigen"
      >
        <span class="icon is-small"><i class="fas fa-question"></i></span>
      </button>
       <!-- Popup für Sanierungen -->
       <div v-if="activeInfoPopup === 'renovationsInfo'" class="info-popup notification is-info is-light">
          <button class="delete" @click.stop="toggleInfoPopup"></button>
          {{ infoText }}
       </div>
    </div>

    <p class="mb-4">Wurden relevante Sanierungsmaßnahmen an folgenden Gebäudeteilen durchgeführt?</p>

    <div class="columns is-multiline is-centered">
      <div
        v-for="option in renovationOptions"
        :key="option.key"
        class="column is-one-quarter-desktop is-half-tablet is-half-mobile"
      >
        <div
          class="card is-clickable"
          @click="selectRenovation(option.key)"
          :class="{ 'is-selected': appStore.formData.renovations?.[option.key] }"
          role="checkbox" :aria-checked="appStore.formData.renovations?.[option.key]" tabindex="0"
          @keydown.enter="selectRenovation(option.key)"
          @keydown.space.prevent="selectRenovation(option.key)"
        >
          <div class="card-image has-text-centered pt-4">
            <figure class="image is-64x64 is-inline-block">
              <!-- Stelle sicher, dass die Bilder unter public/images/ liegen -->
              <img :src="option.image" :alt="option.label">
            </figure>
          </div>
          <div class="card-content has-text-centered">
            <p class="renovation-label">{{ option.label }}</p>
          </div>
        </div>
      </div>
    </div>

     <!-- Fehlermeldung, falls benötigt (z.B. wenn Weiter geklickt wird und nichts ausgewählt ist) -->
     <p v-if="appStore.validationErrors.renovations" class="help is-danger mt-3">
       {{ appStore.validationErrors.renovations }}
     </p>

  </div>
</template>

<style scoped>
/* Wiederverwendung der Stile für Karten und Labels/Popups aus Schritt 1 */
.card.is-clickable {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
  border: 2px solid transparent;
  background-color: #fff;
  border: 1px solid #dbdbdb;
  height: 100%; /* Gleiche Höhe für Karten */
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
.card-content { padding: 0.75rem; }
.renovation-label { /* Eigene Klasse für Konsistenz */
    font-size: 0.9rem;
    font-weight: 600;
}
.card-image img { max-width: 100%; height: auto; }

/* Styles für Label mit Info-Icon und Popup */
.label-with-info {
    display: flex;
    align-items: center;
    position: relative; /* Wichtig für das Popup */
    margin-bottom: 0.5rem;
}
.label-with-info .title { /* Titel statt Label hier */
    margin-bottom: 0 !important;
    margin-right: 0.5rem;
}
.info-icon-button {
    padding: 0.2em 0.5em;
    height: 1.5em;
    line-height: 1;
}
.info-popup {
    position: absolute;
    top: 100%;
    left: 1.5rem; /* Ggf. anpassen basierend auf Titellänge */
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
</style>