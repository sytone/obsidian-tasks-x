export type FeatureFlag = {
    [internalName: string]: boolean;
};

/**
 * The Feature class tracks all the possible features that users can enabled that are in development. This allows
 * new features to be added to the platform but not enabled by default. This reduces the complications when it
 * comes to adding new features and a large cascade of dependent branches.
 *
 * When you add a new feature you need to add it to this class as a static readonly and then add it
 * to the static values getter in Feature. Look at APPEND_GLOBAL_FILTER as an example which was added
 * as part of this change to show how it can be used.
 *
 * Once this is updated the settingsConfiguration with the settings to be enabled by the user when
 * they enable this feature. Do not use this feature as a setting as long term the feature flag
 * should be removed when fully stable/released.
 *
 * The settings.ts file should have the settings added to general settings as well. The PR that introduced this
 * feature added appendGlobalFilter set to false as a new setting under generalSettings.
 *
 * @since 2022-05-29
 */
export class Feature {
    static readonly TASK_STATUS_MENU = new Feature(
        'TASK_STATUS_MENU',
        0,
        'Enables a right click menu for each task to allow you to select the task Status from the available next transition states.',
        'Task Status Menu',
        false,
        false,
    );

    static readonly APPEND_GLOBAL_FILTER = new Feature(
        'APPEND_GLOBAL_FILTER',
        0,
        'Enabling this places the global filter at the end of the task description. Some plugins, such as Day Planner, \n' +
            'might require this, or you might prefer how it looks. If you change this when tasks are modified using the \n' +
            'Task edit box they will have the tag moved to the beginning or end of the description.',
        'Creates / Supports tasks with the global filter at end',
        true,
        true,
    );

    static readonly ENABLE_SQL_QUERY = new Feature(
        'ENABLE_SQL_QUERY',
        0,
        'Enable the ability to use SQL based queries to find tasks. This new syntax can be used by annotating the code block \n' +
            ' with "task-sql" instead of "task"',
        'Enabled SQL based queries',
        true,
        true,
    );

    static readonly ENABLE_TEMPLATE_RENDERING = new Feature(
        'ENABLE_TEMPLATE_RENDERING',
        0,
        `
 This is an enhanced form of rendering the query results that
 allows the user full control over the format of the rendered task
 that a query returns. It uses handlebars based templates with
 helpers that ensure the results work with Obsidian removing the need
 for user to know the internals of the Obsidian HTML structure.
        `,
        'Enable templated rendering',
        false,
        false,
    );

    private constructor(
        public readonly internalName: string,
        public readonly index: number,
        public readonly description: string,
        public readonly displayName: string,
        public readonly enabledByDefault: boolean,
        public readonly stable: boolean,
    ) {}

    static get values(): Feature[] {
        return [this.APPEND_GLOBAL_FILTER, this.ENABLE_SQL_QUERY, this.ENABLE_TEMPLATE_RENDERING];
    }

    static get settingsFlags(): FeatureFlag {
        const featureFlags: { [internalName: string]: boolean } = {};

        Feature.values.forEach((feature) => {
            featureFlags[feature.internalName] = feature.enabledByDefault;
        });
        return featureFlags;
    }

    /**
     * Converts a string to its corresponding default Feature instance.
     *
     * @param string the string to convert to Feature
     * @throws RangeError, if a string that has no corresponding Feature value was passed.
     * @returns the matching Feature
     */
    static fromString(string: string): Feature {
        const value = (this as any)[string];
        if (value) {
            return value;
        }

        throw new RangeError(
            `Illegal argument passed to fromString(): ${string} does not correspond to any available Feature ${
                (this as any).prototype.constructor.name
            }`,
        );
    }

    /**
     * Called when converting the Feature value to a string using JSON.Stringify.
     * Compare to the fromString() method, which deserializes the object.
     */
    public toJSON() {
        return this.internalName;
    }
}
