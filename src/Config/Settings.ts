import { log } from '../Config/LogConfig';
import { Feature, FeatureFlag } from './Feature';

export interface Settings {
    globalFilter: string;
    removeGlobalFilter: boolean;
    setDoneDate: boolean;
    status_types: Array<[string, string, string]>;
    features: FeatureFlag;
    generalSettings: SettingsMap;
    headingOpened: HeadingState;
}

interface SettingsMap {
    [key: string]: string | boolean;
}

type HeadingState = {
    [id: string]: boolean;
};

const defaultSettings: Settings = {
    globalFilter: '',
    removeGlobalFilter: false,
    setDoneDate: true,
    status_types: [['', '', '']],
    features: Feature.settingsFlags,
    generalSettings: {
        globalFilter: '',
        removeGlobalFilter: false,
        setDoneDate: true,
    },
    headingOpened: {}, //;  { 'Documentation and Support': true },
};

let settings: Settings = { ...defaultSettings };

export const getSettings = (): Settings => {
    // Check to see if there is a new flag and if so add it to the users settings.
    for (const flag in Feature.settingsFlags) {
        if (settings.features[flag] === undefined) {
            settings.features[flag] = Feature.settingsFlags[flag];
        }
    }

    return { ...settings };
};

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
    log('debug', `updateSettings ${JSON.stringify(newSettings)}`);

    settings = { ...settings, ...newSettings };

    return getSettings();
};

export const updateGeneralSetting = (name: string, value: string | boolean): Settings => {
    settings.generalSettings[name] = value;

    // Mapping the old settings over on change to the new dynamic structure.
    updateSettings({ globalFilter: <string>settings.generalSettings['globalFilter'] });
    updateSettings({ removeGlobalFilter: <boolean>settings.generalSettings['removeGlobalFilter'] });
    updateSettings({ setDoneDate: <boolean>settings.generalSettings['setDoneDate'] });

    return getSettings();
};

export const updateStatusSetting = (
    status_type: [string, string, string],
    valueIndex: number,
    newValue: string,
): Settings => {
    log('debug', `updateStatusSetting ${JSON.stringify(status_type)}, ${valueIndex}, ${newValue}`);

    const index = settings.status_types.findIndex((element) => {
        return element[0] === status_type[0] && element[1] === status_type[1] && element[2] === status_type[2];
    });

    log('debug', `updateStatusSetting ${index}`);

    if (index > -1) {
        settings.status_types[index][valueIndex] = newValue;
    }

    return getSettings();
};

export const isFeatureEnabled = (internalName: string): boolean => {
    return settings.features[internalName] ?? false;
};

export const toggleFeature = (internalName: string, enabled: boolean): FeatureFlag => {
    settings.features[internalName] = enabled;
    return settings.features;
};
