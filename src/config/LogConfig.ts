import { LogLevel } from 'typescript-logging';
import { CategoryProvider } from 'typescript-logging-category-style';

const provider = CategoryProvider.createProvider('DefaultProvider', {
    level: LogLevel.Debug,
});

export const rootSettings = provider.getCategory('settings');
export const rootQueryService = provider.getCategory('queryService');
export const rootDataStore = provider.getCategory('dataStore');
export const rootMain = provider.getCategory('main');
