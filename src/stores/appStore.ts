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
    constructionYear: number | null; // Erwartet number | null
    heatedArea: number | null;     // Erwartet number | null
    // Schritt 2
    renovations: RenovationState;
    // Schritt 3
    occupants: number | null;        // Erwartet number | null
    energySource: EnergySourceType | null;
    combustionTechnology: CombustionTechType | null; // Hinzugefügt
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
    combustionTechnology: string | null; // Hinzugefügt
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
        combustionTechnology: null, // Initialisiert
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
        combustionTechnology: null, // Initialisiert
    });

    // --- GETTERS ---
    const isFirstStep = computed(() => currentStepId.value === 1);
    const previousStepExists = computed(() => stepHistory.value.length > 0);
    const currentYear = computed(() => new Date().getFullYear());

    const isStep1DataComplete = computed(() => {
        const typeSelected = !!formData.value.buildingType;
        const yearValid = formData.value.constructionYear !== null && !validationErrors.value.constructionYear;
        const areaValid = formData.value.heatedArea !== null && !validationErrors.value.heatedArea;
        // console.log("isStep1DataComplete:", { typeSelected, yearValid, areaValid }); // DEBUG
        return typeSelected && yearValid && areaValid;
    });

    const isStep2DataComplete = computed(() => {
        return !!formData.value.renovations &&
               Object.values(formData.value.renovations).some(isSelected => isSelected);
    });

     const isCombustionTechRelevant = computed(() => {
        const src = formData.value.energySource;
        return src === 'Öl' || src === 'Gas' || src === 'Pellets';
    });

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
    // --- Fügen Sie hier Getter für weitere Schritte hinzu ---

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
                 data.combustionTechnology = null;
                 if(validationErrors.value.combustionTechnology){
                    clearValidationError('combustionTechnology');
                 }
            }
        }

        formData.value = { ...formData.value, ...data };

        // Zugehörige Fehler löschen, wenn Daten gültig werden könnten
        if ('renovations' in data && isStep2DataComplete.value) clearValidationError('renovations');
        if ('occupants' in data && formData.value.occupants !== null && !validationErrors.value.occupants) clearValidationError('occupants');
        if ('energySource' in data && formData.value.energySource !== null) clearValidationError('energySource');
        if ('combustionTechnology' in data && formData.value.combustionTechnology !== null) clearValidationError('combustionTechnology');
    }

     function setConstructionYear(year: number | null | string) {
        // console.log("setConstructionYear called with:", year); // DEBUG
        const parsedValue = typeof year === 'string' && year.trim() !== '' ? parseInt(year, 10) : year;
        let valueToStore: number | null = null;
        let errorMsg: string | null = null;

        clearValidationError('constructionYear');

        if (parsedValue === null || (typeof parsedValue === 'number' && isNaN(parsedValue))) {
            valueToStore = null;
        } else if (typeof parsedValue === 'number') {
            if (parsedValue < 1850) {
                errorMsg = `Baujahr muss nach 1850 liegen.`;
                valueToStore = parsedValue;
            } else if (parsedValue > currentYear.value) {
                errorMsg = `Baujahr darf nicht in der Zukunft liegen (max. ${currentYear.value}).`;
                valueToStore = parsedValue;
            } else {
                valueToStore = parsedValue;
            }
        } else {
             valueToStore = null;
             errorMsg = "Ungültige Eingabe für Baujahr.";
        }

        updateFormData({ constructionYear: valueToStore });
        validationErrors.value.constructionYear = errorMsg;
        // console.log("validationErrors after setConstructionYear:", JSON.stringify(validationErrors.value)); // DEBUG
    }

    function setHeatedArea(area: number | null | string) {
        // console.log("setHeatedArea called with:", area); // DEBUG
        const parsedValue = typeof area === 'string' && area.trim() !== ''
            ? parseFloat(area.replace(',', '.'))
            : (typeof area === 'number' ? area : null);
        let valueToStore: number | null = null;
        let errorMsg: string | null = null;

        clearValidationError('heatedArea');

        if (parsedValue === null || (typeof parsedValue === 'number' && isNaN(parsedValue))) {
           valueToStore = null;
        } else if (typeof parsedValue === 'number') {
            if (parsedValue < 70) {
                errorMsg = `Fläche muss mindestens 70 m² betragen.`;
                valueToStore = parsedValue;
            } else if (parsedValue > 400) {
                errorMsg = `Fläche darf maximal 400 m² betragen.`;
                valueToStore = parsedValue;
            } else {
               valueToStore = parsedValue;
            }
        } else {
            valueToStore = null;
            errorMsg = "Ungültige Eingabe für Fläche.";
        }

        updateFormData({ heatedArea: valueToStore });
        validationErrors.value.heatedArea = errorMsg;
        // console.log("validationErrors after setHeatedArea:", JSON.stringify(validationErrors.value)); // DEBUG
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
        const parsedValue = typeof count === 'string' && count.trim() !== '' ? parseInt(count, 10) : count;
        let valueToStore: number | null = null;
        let errorMsg: string | null = null;

        clearValidationError('occupants');

        if (parsedValue === null || (typeof parsedValue === 'number' && isNaN(parsedValue))) {
            valueToStore = null;
        } else if (typeof parsedValue === 'number') {
            if (parsedValue < 1 || parsedValue > 10) {
                errorMsg = "Die Personenzahl muss zwischen 1 und 10 liegen.";
                valueToStore = parsedValue;
            } else {
                valueToStore = Math.floor(parsedValue);
            }
        } else {
             valueToStore = null;
             errorMsg = "Ungültige Eingabe für Personenzahl.";
        }
        updateFormData({ occupants: valueToStore });
        validationErrors.value.occupants = errorMsg;
    }

    function selectEnergySource(source: EnergySourceType | null) {
        // Beim Ändern des Energieträgers die Heiztechnik mit zurücksetzen
        updateFormData({
            energySource: source,
            combustionTechnology: null // Immer zurücksetzen
        });
    }

    function setCombustionTechnology(tech: CombustionTechType | null) {
        updateFormData({ combustionTechnology: tech });
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