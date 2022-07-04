const FS = require('fs');

const packageJSON = JSON.parse(FS.readFileSync('package.json').toString());
const dependencies = packageJSON.dependencies;

const LICENSE_NAMES = ['LICENSE', 'license', 'LICENSE.md', 'LICENSE.txt', 'LICENCE'];

let FAILED_TO_FIND_LICENSES = false;

let libraries = Object.keys(dependencies);

libraries.forEach((key) => {
    console.log('\n/*');
    console.log('License ' + key + ' (included library):');
    console.log('================================');

    const path = 'node_modules/' + key;

    let license = null;

    LICENSE_NAMES.forEach((name) => {
        try {
            license = FS.readFileSync(path + '/' + name).toString();
        } catch (e) {}
    });

    if (!license) {
        try {
            let libraryPackageFile = FS.readFileSync(path + '/package.json').toString();
            // You can try to get the license from the package.json here
        } catch (e) {}
    }

    if (license) {
        console.log(license);
    } else {
        console.log('License not found');
        FAILED_TO_FIND_LICENSES = true;

        try {
            // This is to help update the LICENSE_NAMES before re-run it
            let files = FS.readdirSync(path);
            files.forEach((file) => {
                console.log(file);
            });
        } catch (e) {}
    }
    console.log('*/');
});

if (FAILED_TO_FIND_LICENSES) {
    console.error('WARN: The license for some dependencies was not found!');
}
