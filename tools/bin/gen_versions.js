// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

'use strict';

const path = require('node:path');
const yaml = require('js-yaml');
const semver = require('semver');
const util = require('./util');

// constants
const LANGUAGE_MAP = {
    en: 'English'
};

function main () {
    const scriptName = process.argv[1];
    const rootDir = process.argv[2];
    const config = {};

    if (!rootDir) {
        console.error('Please specify a directory from which to generate.');
        process.exit(1);
    }

    // go through directory that contains all languages
    util.listdirsSync(rootDir).forEach(function (langId) {
        const langPath = path.join(rootDir, langId);

        // Get all directories, excluding dev, and make sure it is in lexicographically order.
        const versionNames = util.listdirsSync(langPath)
            .filter(dir => dir !== 'dev')
            .sort((a, b) => a.localeCompare(b));

        // Semver cant sort invalid values. E.g. 10.x or 12.x-2025.01
        // Will create an array of objects containing the coerce value (10.0.0) for sorting and
        // the original readable name for display.
        const versionMap = versionNames.map((readable) => {
            const [versionPart] = readable.split('-');
            const coerced = semver.coerce(versionPart)?.toString() || versionPart;
            return { readable, semantic: coerced };
        });

        const sortedVersions = versionMap.filter(v => semver.valid(v.semantic))
            .sort((a, b) => semver.compare(a.semantic, b.semantic))
            .map(v => v.readable);

        sortedVersions.push('dev'); // add back dev

        // get language ID
        const langName = LANGUAGE_MAP[langId];
        if (!langName) {
            console.error("Language identifier '" + langId + "' doesn't have an associated name. Please fix that by changing " + scriptName + '.');
            process.exit(1);
        }

        // set the language name and the versions it has
        config[langId] = {
            name: langName,
            versions: sortedVersions
        };
    });

    console.log(util.generatedBy(__filename));
    console.log(yaml.dump(config, { indent: 4 }));
}

main();
