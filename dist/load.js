"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var graphql_request_1 = require("graphql-request");
var papa = require("papaparse");
var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
exports.command = 'load [--json] [--csv] [--endpoint] [--mutation] [--mapping] [--delim]';
exports.desc = 'Loads data from sources using mutations using .graphqlconfig';
exports.builder = {
    mapping: {
        alias: 'p',
        description: 'name mapping of input to mutation (json)'
    },
    mutation: {
        alias: 'm',
        description: 'mutation to call'
    },
    endpoint: {
        alias: 'e',
        description: 'endpoint name to use'
    },
    json: {
        alias: 'j',
        description: 'json file to load'
    },
    csv: {
        alias: 'c',
        description: 'csv file to load'
    },
    delim: {
        alias: 'd',
        description: 'delimiter for arrays'
    }
};
function getSchema(config, basePath) {
    var schemaPath = path.join(basePath, config.schemaPath);
    var schemaContents = fs.readFileSync(schemaPath).toString();
    return graphql_1.buildASTSchema(graphql_1.parse(schemaContents));
}
;
function readFile(basePath, options, argv) {
    var file = argv.csv || options.csv;
    if (file) {
        file = (file[0] == '/') ? file : path.join(basePath, file);
        var text = fs.readFileSync(file, 'utf-8');
        var data = papa.parse(text, { header: true });
        if (data.errors.length > 0) {
            return console.log(chalk.red("Error parsing CSV-file " + file + " rows: " + data.data.length + " errors: " + JSON.stringify(data.errors) + "\n meta: " + JSON.stringify(data.meta)));
        }
        console.log(chalk.green("Done parsing CSV-file " + file + " rows: " + data.data.length + "\n meta: " + JSON.stringify(data.meta)));
        return data.data;
    }
    file = argv.json || options.json;
    if (file) {
        file = (file[0] == '/') ? file : path.join(basePath, file);
        var text = fs.readFileSync(file, 'utf-8');
        var data = JSON.parse(text);
        if (!data) {
            return console.log(chalk.red("Error parsing JSON-file " + file));
        }
        console.log(chalk.green("Done parsing JSON-file " + file + " rows: " + data.length));
        return data;
    }
    else {
        return console.log(chalk.red("No csv or json file configured in section \"load\""));
    }
}
function getEndpoint(config, argv) {
    var extensions = config.extensions || {};
    var endpoints = extensions.endpoints || {};
    var key = argv.endpoint || Object.keys(endpoints)[0];
    if (!key) {
        return console.log(chalk.red("No endpoint found."));
    }
    var endpoint = endpoints[key];
    if (!endpoint) {
        return console.log(chalk.red("No endpoint " + key + " found."));
    }
    if (typeof (endpoint) === "string") {
        endpoint = { url: endpoint };
    }
    console.log(chalk.green("Using endpoint " + key + ": " + JSON.stringify(endpoint)));
    return endpoint;
}
function getMutation(config, basePath, argv) {
    var extensions = config.extensions || {};
    var options = extensions.load || {};
    var schema = getSchema(config, basePath);
    var mutationType = schema.getMutationType();
    if (!mutationType) {
        return console.log(chalk.red("No mutation type in schema."));
    }
    var fields = mutationType.getFields();
    var mutationName = argv.mutation || options.mutation;
    var mutationField = fields[mutationName];
    if (!mutationField) {
        return console.log(chalk.red("Mutation for \"" + mutationName + "\" not found."));
    }
    console.log(chalk.green("Using mutation \"" + mutationField.name + "\": \"" + mutationField.description + "\"."));
    return mutationField;
}
function findReturnExpression(mutationField) {
    var returnType = graphql_1.getNamedType(mutationField.type);
    if (returnType instanceof graphql_1.GraphQLObjectType) {
        var fields_1 = returnType.getFields();
        var field = Object.keys(fields_1).find(function (x) { return (graphql_1.getNamedType(fields_1[x].type) === graphql_1.GraphQLID); }) || Object.keys(fields_1)[0];
        return "{ " + field + " }";
    }
    return "";
}
function buildMutations(mutationField, args, data, mapping, delim) {
    var rMapping = {};
    var regexp = new RegExp(delim + "\s*");
    Object.keys(mapping).forEach(function (k) { return rMapping[mapping[k]] = k; });
    var mutations = data.map(function (row, idx) {
        var fullfilled = true;
        var params = Object.keys(args).map(function (key) {
            var arg = args[key];
            var column = (rMapping[key] || key).toString();
            // todo params
            var value = row[column]; // sometimes this is not wanted, e.g. if there is a crossover naming // || row[key]
            var type = arg.type.toString();
            var namedType = graphql_1.getNamedType(arg.type).name;
            var isList = type.indexOf("]") != -1;
            var isNonNull = type.charAt(type.length - 1) == '!';
            if (value === null || value === undefined) {
                if (isNonNull)
                    fullfilled = false;
                return null;
            }
            if (isList) {
                if (!Array.isArray(value)) {
                    if (typeof (value) == 'string') {
                        value = value.trim();
                        if (value.charAt(0) == '[')
                            value = JSON.parse(value);
                        else if (value.indexOf(delim) > -1)
                            value = value.split(regexp);
                    }
                }
            }
            if (isList) {
                value = JSON.stringify(value);
            }
            else if (namedType == "String" || namedType == "ID") {
                value = JSON.stringify(value.toString());
            }
            return arg.name + ": " + value;
        }).filter(function (v) { return v !== null; }).join(",");
        var returnExpression = findReturnExpression(mutationField);
        return fullfilled ? "_" + idx + " : " + mutationField.name + " ( " + params + " ) " + returnExpression : null;
    }).filter(function (v) { return v !== null; }).join("\n");
    return "mutation { \n" + mutations + "\n}";
}
function parseJson(str) {
    try {
        return JSON.parse(str);
    }
    catch (e) {
        throw new Error("Error parsing " + str + " as JSON: " + e);
    }
}
exports.handler = function (_a, argv) {
    var getConfig = _a.getConfig;
    return __awaiter(_this, void 0, void 0, function () {
        var _b, config, configPath, basePath, extensions, options, endpoint, mutationField, args, data, mapping, delim, mutations, client, result;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = getConfig(), config = _b.config, configPath = _b.configPath;
                    basePath = path.dirname(configPath);
                    extensions = config.extensions || {};
                    options = extensions.load || {};
                    endpoint = getEndpoint(config, argv);
                    if (!endpoint)
                        return [2 /*return*/];
                    mutationField = getMutation(config, basePath, argv);
                    if (!mutationField)
                        return [2 /*return*/];
                    args = {};
                    mutationField.args.forEach(function (arg) { return args[arg.name] = arg; });
                    data = readFile(basePath, options, argv);
                    mapping = parseJson(argv.mapping || "null") || options.mapping || {};
                    if (Object.keys(mapping).length > 0) {
                        console.log(chalk.yellow("Using mapping: " + JSON.stringify(mapping)));
                    }
                    delim = argv.delim || ';';
                    console.log("mutationField", mutationField);
                    mutations = buildMutations(mutationField, args, data, mapping, delim);
                    console.log(chalk.yellow("Sending query:\n" + mutations.substring(0, 200) + "..."));
                    client = new graphql_request_1.GraphQLClient(endpoint.url, endpoint);
                    return [4 /*yield*/, client.request(mutations, {})];
                case 1:
                    result = _c.sent();
                    if (result["errors"]) {
                        console.log(chalk.red("X Call failed! " + JSON.stringify(result["errors"])));
                    }
                    else {
                        console.log(chalk.green("\u2714 Call succeeded:\n" + JSON.stringify(result).substring(0, 200) + "..."));
                    }
                    return [2 /*return*/];
            }
        });
    });
};
//# sourceMappingURL=load.js.map