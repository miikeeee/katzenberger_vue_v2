import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';

// --- TYPE DEFINITIONS ---
export type BuildingType = 'EFH' | 'ZFH' | 'MFH';
export type RenovationPart = 'Dach' | 'Fassade' | 'Fenster' | 'Keine';
export type EnergySourceType = 'Öl' | 'Gas' | 'Wärmepumpe' | 'Fernwärme' | 'Pellets' | 'Sonstige';
export type CombustionTechType = 'Brennwert' | 'Heizwert' | 'Weiß nicht';

// --- INTERFACE DEFINITIONS ---
export interface RenovationState {
    Dach: boolean;
    Fassade: boolean;
    Fenster: boolean;
    Keine: boolean;
}

export interface FormData {
    // Schritt 1
    buildingType: BuildingType | null;
    constructionYear: number | null;
    heatedArea: number | null;
    // Schritt 2
    renovations: RenovationState;
    // Schritt 3
    occupants: number | null;
    energySource: EnergySourceType | null;
    combustionTechnology: CombustionTechType | null;
    // Platzhalter
    energyConsumption: number | null;
    heatingSystem: 'Radiator' | 'Floor' | 'Both' | null;
    waterHeating: 'Central' | 'Decentral' | null;
}

interface UploadResponseData {
     fileUrl?: string;
     message?: string;
}

interface ValidationErrors {
    constructionYear: string | null;
    heatedArea: string | null;
    renovations: string | null;
    occupants: string | null;
    energySource: string | null;
    combustionTechnology: string | null;
    [key: string]: string | null;
}


// --- PINIA STORE DEFINITION ---
export const useAppStore = defineStore('app', () => {
    // --- STATE ---
    const currentStepId: Ref<string | number> = ref(1);
    const formData: Ref<FormData> = ref({
        buildingType: null,
        constructionYear: null,
        heatedArea: null,
        renovations: { Dach: false, Fassade: false, Fenster: false, Keine: false },
        occupants: null,
        energySource: null,
        combustionTechnology: null,
        energyConsumption: null,
        heatingSystem: null,
        waterHeating: null,
    });
    const stepHistory: Ref<(string | number)[]> = ref([]);
    const calculatedResult: Ref<any> = ref(null);
    const isUploading: Ref<boolean> = ref(false);
    const uploadError: Ref<string | null> = ref(null);
    const uploadResponseData: Ref<UploadResponseData | null> = ref(null);
    const validationErrors: Ref<ValidationErrors> = ref({
        constructionYear: null,
        heatedArea: null,
        renovations: null,
        occupants: null,
        energySource: null,
        combustionTechnology: null,
    });

    // --- GETTERS ---
    const isFirstStep = computed(() => currentStepId.value === 1);
    const previousStepExists = computed(() => stepHistory.value.length > 0);
    const currentYear = computed(() => new Date().getFullYear());

    // Getter für Schritt 1
    const isStep1DataComplete = computed(() => {
        const typeSelected = !!formData.value.buildingType;
        const yearValid = formData.value.constructionYear !== null && !validationErrors.value.constructionYear;
        const areaValid = formData.value.heatedArea !== null && !validationErrors.value.heatedArea;
        // console.log("isStep1DataComplete:", { typeSelected, yearValid, areaValid }); // DEBUG
        return typeSelected && yearValid && areaValid;
    });

    // Getter für Schritt 2
    const isStep2DataComplete = computed(() => {
        return !!formData.value.renovations &&
               Object.values(formData.value.renovations).some(isSelected => isSelected);
    });

    // Getter für Schritt 3 - Relevant für Verbrennungstechnik?
     const isCombustionTechRelevant = computed(() => {
        const src = formData.value.energySource;
        return src === 'Öl' || src === 'Gas' || src === 'Pellets';
    });

    // Getter für Schritt 3 - Gesamtvalidierung
    const isStep3DataComplete = computed(() => {
        const baseComplete = formData.value.occupants !== null && !validationErrors.value.occupants &&
                             formData.value.energySource !== null && !validationErrors.value.energySource;
        if (isCombustionTechRelevant.value) {
            return baseComplete &&
                   formData.value.combustionTechnology !== null &&
                   !validationErrors.value.combustionTechnology;
        } else {
            return baseComplete;
        }
    });

    // --- ACTIONS ---
    function nextStep(stepId: string | number) {
        stepHistory.value.push(currentStepId.value);
        currentStepId.value = stepId;
    }

    function previousStep() {
        if (previousStepExists.value) {
            const previous = stepHistory.value.pop();
            if (previous !== undefined) {
                currentStepId.value = previous;
            }
        }
    }

    function updateFormData(data: Partial<FormData>) {
        // Vor dem Update prüfen, ob energySource geändert wird und combustionTechnology zurückgesetzt werden muss
        if ('energySource' in data && formData.value.combustionTechnology) {
            const newSource = data.energySource;
            const isTechStillRelevant = newSource === 'Öl' || newSource === 'Gas' || newSource === 'Pellets';
            if (!isTechStillRelevant) {
                // Wenn die Technik nicht mehr relevant ist, setze sie im *data*-Objekt zurück,
                // damit sie zusammen mit energySource aktualisiert wird.
                 data.combustionTechnology = null; // Setze es im Payload zurück
                 if(validationErrors.value.combustionTechnology){
                    clearValidationError('combustionTechnology'); // Lösche auch den Fehler
                 }
            }
        }

        // Führe das Update durch
        formData.value = { ...formData.value, ...data };

        // Zugehörige Fehler löschen (redundant zu Settern, aber sicher ist sicher)
        if ('renovations' in data && isStep2DataComplete.value) {
             clearValidationError('renovations');
        }
        if ('occupants' in data && formData.value.occupants !== null && !validationErrors.value.occupants) {
             clearValidationError('occupants');
        }
        if ('energySource' in data && formData.value.energySource !== null) {
            clearValidationError('energySource');
        }
        if ('combustionTechnology' in data && formData.value.combustionTechnology !== null) {
            clearValidationError('combustionTechnology');
        }
    }

     function setConstructionYear(year: number | null | string) {
        console.log("setConstructionYear called with:", year); // DEBUG
        const numYear = typeof year === 'string' && year.trim() !== '' ? parseInt(year, 10) : year;
        let currentData = formData.value.constructionYear; // Behalte aktuellen Wert für updateFormData
        let errorMsg: string | null = null;

        clearValidationError('constructionYear'); // Fehler immer zuerst löschen

        if (numYear === null || (typeof numYear === 'number' && isNaN(numYear))) {
             currentData = null;
             // errorMsg = "Baujahr ist ein Pflichtfeld."; // Optional
        } else if (numYear < 1850) {
            errorMsg = `Baujahr muss nach 1850 liegen.`;
            currentData = numYear; // Wert trotzdem setzen
        } else if (numYear > currentYear.value) {
            errorMsg = `Baujahr darf nicht in der Zukunft liegen (max. ${currentYear.value}).`;
            currentData = numYear; // Wert trotzdem setzen
        } else {
            currentData = numYear; // Gültiger Wert
        }

        // Daten und Fehler aktualisieren
        updateFormData({ constructionYear: currentData }); // formData aktualisieren
        validationErrors.value.constructionYear = errorMsg; // Fehler setzen
        console.log("validationErrors after setConstructionYear:", JSON.stringify(validationErrors.value)); // DEBUG
    }

    function setHeatedArea(area: number | null | string) {
        console.log("setHeatedArea called with:", area); // DEBUG
        const numArea = typeof area === 'string' && area.trim() !== ''
            ? parseFloat(area.replace(',', '.'))
            : (typeof area === 'number' ? area : null);
        let currentData = formData.value.heatedArea;
        let errorMsg: string | null = null;

        clearValidationError('heatedArea');

        if (numArea === null || (typeof numArea === 'number' && isNaN(numArea))) {
           currentData = null;
           // errorMsg = "Fläche ist ein Pflichtfeld."; // Optional
        } else if (numArea < 70) {
            errorMsg = `Fläche muss mindestens 70 m² betragen.`;
            currentData = numArea;
        } else if (numArea > 400) {
            errorMsg = `Fläche darf maximal 400 m² betragen.`;
            currentData = numArea;
        } else {
           currentData = numArea;
        }

        updateFormData({ heatedArea: currentData });
        validationErrors.value.heatedArea = errorMsg;
        console.log("validationErrors after setHeatedArea:", JSON.stringify(validationErrors.value)); // DEBUG
    }

    function toggleRenovation(part: RenovationPart) {
        if (!formData.value.renovations) return;
        const currentRenovations = { ...formData.value.renovations };
        if (part === 'Keine') {
            currentRenovations.Keine = true;
            currentRenovations.Dach = false;
            currentRenovations.Fassade = false;
            currentRenovations.Fenster = false;
        } else {
            currentRenovations[part] = !currentRenovations[part];
            currentRenovations.Keine = false;
        }
        updateFormData({ renovations: currentRenovations });
    }

    function setOccupants(count: number | null | string) {
        const numCount = typeof count === 'string' && count.trim() !== '' ? parseInt(count, 10) : count;
        let currentData = formData.value.occupants;
        let errorMsg: string | null = null;

        clearValidationError('occupants');

        if (numCount === null || (typeof numCount === 'number' && isNaN(numCount))) {
            currentData = null;
            // errorMsg = "Bitte geben Sie die Personenzahl an."; // Optional
        } else if (numCount < 1 || numCount > 10) {
            errorMsg = "Die Personenzahl muss zwischen 1 und 10 liegen.";
            currentData = numCount;
        } else {
            currentData = Math.floor(numCount);
        }
        updateFormData({ occupants: currentData });
        validationErrors.value.occupants = errorMsg;
    }

    function selectEnergySource(source: EnergySourceType | null) {
        // Beim Ändern des Energieträgers die Heiztechnik mit zurücksetzen
        updateFormData({
            energySource: source,
            combustionTechnology: null // Immer zurücksetzen
        });
        // Fehler löschen (passiert jetzt in updateFormData)
    }

    function setCombustionTechnology(tech: CombustionTechType | null) {
        updateFormData({ combustionTechnology: tech });
        // Fehler löschen (passiert jetzt in updateFormData)
    }

    function clearValidationError(field: keyof ValidationErrors) {
        // console.log("Clearing validation error for:", field); // DEBUG
        if (field in validationErrors.value) {
             validationErrors.value[field] = null;
        }
     }

    function resetUploadState() {
        isUploading.value = false;
        uploadError.value = null;
        uploadResponseData.value = null;
    }

     function setCalculatedResult(result: any) {
        calculatedResult.value = result;
     }

     function resetStore() {
        currentStepId.value = 1;
        formData.value = {
            buildingType: null, constructionYear: null, heatedArea: null,
            renovations: { Dach: false, Fassade: false, Fenster: false, Keine: false },
            occupants: null, energySource: null, combustionTechnology: null,
            energyConsumption: null, heatingSystem: null, waterHeating: null,
        };
        stepHistory.value = [];
        calculatedResult.value = null;
        validationErrors.value = {
             constructionYear: null, heatedArea: null, renovations: null,
             occupants: null, energySource: null, combustionTechnology: null,
        };
        resetUploadState();
     }

    // --- RÜCKGABE ---
    return {
        currentStepId, formData, stepHistory, calculatedResult, isUploading, uploadError, uploadResponseData, validationErrors,
        isFirstStep, previousStepExists, isStep1DataComplete, isStep2DataComplete, isStep3DataComplete, currentYear, isCombustionTechRelevant,
        nextStep, previousStep, updateFormData, setConstructionYear, setHeatedArea, toggleRenovation, setOccupants, selectEnergySource, setCombustionTechnology, clearValidationError, resetUploadState, setCalculatedResult, resetStore,
    };
});