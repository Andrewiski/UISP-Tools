(function () {

    'use strict';

    angular.module('deapp')
    .factory('addressService', ['$http', '$q',  '$log', 'deui', function ($http, $q, $log,  deui) {
        var service = {};

        service.commonData = {
            states: undefined,
            streetDirections: undefined,
            streetSuffixes: undefined,
            unitTypes: undefined,
            addressTypes:undefined,
            emptyAddress:undefined
        }

        service.getEmptyAddress = function () {
            //we could go fetch this from the server but we will try it this way instead.

            return { addressType: { name: ''} }

        }
        service.getStates = function () {
            $log.debug('addressService getStates');
            var deferred = $q.defer();

            if (service.commonData.states == undefined) {
                var apiParms = {
                    resource: "CTMState_Select"
                };
                deui.postResource(apiParms)
                    .then(function (results) {
                        service.commonData.states = results;
                        deferred.resolve(results);
                    }, function (results) {
                        $log.error('addressService getStates failed ' + results);
                        deferred.reject(results);
                    });
            } else {
                //We already have the States List Just Return it
                deferred.resolve(service.commonData.states);
            }
            return deferred.promise;
        }

        //service.getCitiesForState = function (state,cityName) {
        //    $log.debug('addressService getCitiesForState');
        //    var deferred = $q.defer();

        //    if (state.cities == undefined) {
        //        deui.postResource({
        //            resource: "CTMCities_Select",
        //            parms: {
        //                "@CTMStateID": state.CTMStateID
        //            }
        //        }).then(
        //        function (result) {
        //            state.cities = result;
        //            deferred.resolve(state.cities);
        //        },
        //        function (result) {
        //            $log.error('addressService getCitiesForState failed ' + results);
        //            deferred.reject(results);
        //        });
        //    } else {
        //        //we have already fetched the states so just return them
        //        deferred.resolve(state.cities);
        //    }
        //    return deferred.promise;
        //}

        //this function is used search a javascript array of address returning the fist address that matches a specific type
        service.findAddressByType = function (addresses, addressTypeName) {
            $log.debug('addressService findAddressByType');
            for (var i = 0; i < addresses.length; i++) {
                var address = addresses[i];
                if (address.addressType.name == addressTypeName) {
                    return address;
                }
            }
        }

        //this function is used search a javascript array of address returning an array of addresses that matches a specific type
        service.findAddressesByType = function (addresses, addressTypeName) {
            $log.debug('addressService findAddressesByType');

            var retval = [];
            angular.forEach(addresses, function (value, key) {
                if(value.addressType.name == addressTypeName){
                    retval.push(value);
                }
            }, log);
            return retval;
        }

        service.findCitiesForState = function (state, cityName) {
            $log.debug('addressService findCitiesForState');
            var deferred = $q.defer();

            
            deui.postResource({
                resource: "CTMCities_Find",
                parms: {
                    "@CityName": cityName,
                    "@CTMStateID": state.CTMStateID
                }
            }).then(
            function (result) {
                deferred.resolve(state.cities);
            },
            function (result) {
                $log.error('addressService getCitiesForState failed ' + results);
                deferred.reject(results);
            });
            
            return deferred.promise;
        }

        service.findCountiesForState = function (state, cityName) {
            $log.debug('addressService findCountiesForState');
            var deferred = $q.defer();

            
            deui.postResource({
                resource: "CTMCounties_Find",
                parms: {
                    "@CountyName": cityName,
                    "@CTMStateID": state.CTMStateID
                }
            }).then(
            function (result) {
                deferred.resolve(state.cities);
            },
            function (result) {
                $log.error('addressService findCountiesForState failed ' + results);
                deferred.reject(results);
            });
            
            return deferred.promise;
        }

        service.findPostalCodesForState = function (state, cityName) {
            $log.debug('addressService findPostalCodesForState');
            var deferred = $q.defer();
            deui.postResource({
                resource: "CTMPostalCodes_Find",
                parms: {
                    "@PostalCode": cityName,
                    "@CTMStateID": state.CTMStateID
                }
            }).then(
            function (result) {
                state.cities = result;
                deferred.resolve(state.cities);
            },
            function (result) {
                $log.error('addressService findPostalCodesForState failed ' + results);
                deferred.reject(results);
            });

            return deferred.promise;
        }

        service.getAddressTypes = function () {
            $log.debug('addressService getAddressTypes');
            var deferred = $q.defer();

            if (service.commonData.addressTypes == undefined){
                var fetchPromise = deui.ajax({url:'/api/AddressType'});
                fetchPromise.then(function (addressTypeList) {
                    console.log('Got AddressType List');
                    service.commonData.addressTypes = addressTypeList;
                    deferred.resolve(service.commonData.addressTypes);
                }, function (result) {
                    console.log('addressService getaddressTypes Failed');
                    deferred.reject(result);
                });
            } else {
                deferred.resolve(service.commonData.addressTypes);
            }

            return deferred.promise;
        }


        service.getStreetDirections = function () {
            $log.debug('addressService getStreetDirections');
            var deferred = $q.defer();

            if (service.commonData.streetDirections == undefined) {
                service.commonData.streetDirections = [
                        { name: "North", alias: ["north", "n", "n."], value: "N", rank: 5 },
                        { name: "South", alias: ["south", "s", "s."], value: "S", rank: 5 },
                        { name: "East", alias: ["east", "e", "e."], value: "E", rank: 5 },
                        { name: "West", alias: ["west", "w", "w."], value: "W", rank: 5 },
                ]
                deferred.resolve(service.commonData.streetDirections);
            } else {
                //We Already have the list just return it.
                deferred.resolve(service.commonData.streetDirections);
            }
            return deferred.promise;
        }


        service.getUnitTypes = function () {
            $log.debug('addressService getUnitTypes');
            var deferred = $q.defer();
            if (service.commonData.unitTypes == undefined) {
                service.commonData.unitTypes =
                 [
                    { name: "Apartment", alias: ["apartment", "apt"], value: "APT", rank: 5 },
                    { name: "Basement", alias: ["basement", "bsmt"], value: "BSMT", rank: 5 },
                    { name: "Building", alias: ["Building", "bldg"], value: "BLDG", rank: 5 },
                    { name: "Department", alias: ["department", "dept"], value: "DEPT", rank: 5 },
                    { name: "Floor", alias: ["floor", "fl"], value: "FL", rank: 5 },
                    { name: "Front", alias: ["front", "frnt"], value: "FRNT", rank: 5 },
                    { name: "Hanger", alias: ["hanger", "hngr"], value: "HNGR", rank: 5 },
                    { name: "Key", alias: ["key"], value: "KEY", rank: 5 },
                    { name: "Lobby", alias: ["lobby", "lbby"], value: "LBBY", rank: 5 },
                    { name: "Lot", alias: ["lot"], value: "LOT", rank: 5 },
                    { name: "Lower", alias: ["lower", "lowr"], value: "LOWR", rank: 5 },
                    { name: "Penthouse", alias: ["office", "ofc"], value: "OFC", rank: 5 },
                    { name: "Office", alias: ["penthouse", "ph"], value: "PH", rank: 5 },
                    { name: "Pier", alias: ["pier"], value: "PIER", rank: 5 },
                    { name: "Rear", alias: ["rear"], value: "REAR", rank: 5 },
                    { name: "Room", alias: ["room", "rm"], value: "RM", rank: 5 },
                    { name: "Side", alias: ["side"], value: "SIDE", rank: 5 },
                    { name: "Slip", alias: ["slip"], value: "SLIP", rank: 5 },
                    { name: "Space", alias: ["space", "spc"], value: "SPC", rank: 5 },
                    { name: "Stop", alias: ["stop"], value: "STOP", rank: 5 },
                    { name: "Suite", alias: ["suite"], value: "STE", rank: 5 },
                    { name: "Trailer", alias: ["trailer", "TRLR"], value: "TRLR", rank: 5 },
                    { name: "Unit", alias: ["unit"], value: "UNIT", rank: 5 },
                    { name: "Upper", alias: ["upper", "uppr"], value: "UPPR", rank: 5 }
                 ]
                deferred.resolve(service.commonData.getUnitTypes);
            } else {
                //We Already have the list just return it.
                deferred.resolve(service.commonData.getUnitTypes);
            }
            return deferred.promise;
        }

        service.getStreetSuffixes = function() {
            $log.debug('addressService getStreetSuffixes');
            var deferred = $q.defer();
            if (service.commonData.streetSuffixes == undefined) {
                service.commonData.streetSuffixes = [
                    { name: "ALLEY", alias: ["ALLEE", "ALY", "ALLEY", "ALLY"], value: "ALY", rank: 5 },
                    { name: "ANEX", alias: ["ANEX", "ANX", "ANNEX", "ANNX"], value: "ANX", rank: 5 },
                    { name: "ARCADE", alias: ["ARC", "ARC", "ARCADE"], value: "ARC", rank: 5 },
                    { name: "AVENUE", alias: ["AV", "AVE", "AVEN", "AVENU", "AVENUE", "AVN", "AVNUE"], value: "AVE", rank: 5 },
                    { name: "BAYOU", alias: ["BAYOO", "BAYOU", "BYU"], value: "BYU", rank: 5 },
                    { name: "BEACH", alias: ["BCH", "BEACH"], value: "BCH", rank: 5 },
                    { name: "BEND", alias: ["BEND", "BND"], value: "BND", rank: 5 },
                    { name: "BLUFF", alias: ["BLF", "BLUF", "BLUFF", "BLUFFS", "BLUFFS", "BLFS"], value: "BLF", rank: 5 },
                    { name: "BOTTOM", alias: ["BOT", "BTM", "BOTTM", "BOTTOM"], value: "BTM", rank: 5 },
                    { name: "BOULEVARD", alias: ["BLVD", "BOUL", "BOULEVARD", "BOULV"], value: "BLVD", rank: 5 },
                    { name: "BRANCH", alias: ["BR", "BRNCH", "BRANCH"], value: "BR", rank: 5 },
                    { name: "BRIDGE", alias: ["BRDGE", "BRG", "BRIDGE"], value: "BRG", rank: 5 },
                    { name: "BROOK", alias: ["BRK", "BROOK", "BROOKS", "BROOKS", "BRKS"], value: "BRK", rank: 5 },
                    { name: "BURG", alias: ["BURG", "BG"], value: "BG", rank: 5 },
                    { name: "BURGS", alias: ["BURG", "BURGS", "BURGS", "BGS"], value: "BGS", rank: 5 },
                    { name: "BYPASS", alias: ["BYP", "BYPA", "BYPAS", "BYPASS", "BYPS"], value: "BYP", rank: 5 },
                    { name: "CAMP", alias: ["CAMP", "CP", "CMP"], value: "CP", rank: 5 },
                    { name: "CANYON", alias: ["CANYN", "CANYON", "CNYN"], value: "CYN", rank: 5 },
                    { name: "CAPE", alias: ["CAPE", "CPE"], value: "CPE", rank: 5 },
                    { name: "CAUSEWAY", alias: ["CAUSEWAY", "CAUSWA", "CSWY"], value: "CSWY", rank: 5 },
                    { name: "CENTER", alias: ["CEN", "CENT", "CENTER", "CENTR", "CENTRE", "CNTER", "CNTR", "CTR"], value: "CTR", rank: 5 },
                    { name: "CENTERS", alias: ["CENTERS"], value: "CTRS", rank: 5 },
                    { name: "CIRCLE", alias: ["CIR", "CIRC", "CIRCL", "CIRCLE", "CRCL", "CRCLE"], value: "CIR", rank: 5 },
                    { name: "CIRCLES", alias: ["CIRCLES"], value: "CIRS", rank: 5 },
                    { name: "CLIFF", alias: ["CLF", "CLIFF"], value: "CLF", rank: 5 },
                    { name: "CLIFFS", alias: ["CLFS", "CLIFFS"], value: "CLFS", rank: 5 },
                    { name: "CLUB", alias: ["CLB", "CLUB"], value: "CLB", rank: 5 },
                    { name: "COMMON", alias: ["COMMON"], value: "CMN", rank: 5 },
                    { name: "COMMONS", alias: ["COMMONS"], value: "CMNS", rank: 5 },
                    { name: "CORNER", alias: ["COR", "CORNER"], value: "COR", rank: 5 },
                    { name: "CORNERS", alias: ["CORNERS", "CORS"], value: "CORS", rank: 5 },
                    { name: "COURSE", alias: ["COURSE", "CRSE"], value: "CRSE", rank: 5 },
                    { name: "COURT", alias: ["COURT", "CT"], value: "CT", rank: 5 },
                    { name: "COURTS", alias: ["COURTS", "CTS"], value: "CTS", rank: 5 },
                    { name: "COVE", alias: ["COVE", "CV"], value: "CV", rank: 5 },
                    { name: "COVES", alias: ["COVES"], value: "CVS", rank: 5 },
                    { name: "CREEK", alias: ["CREEK", "CRK"], value: "CRK", rank: 5 },
                    { name: "CRESCENT", alias: ["CRESCENT", "CRES", "CRSENT", "CRSNT"], value: "CRES", rank: 5 },
                    { name: "CREST", alias: ["CRESCENT", "CRES", "CRSENT", "CRSNT", "CREST", "CREST", "CRST"], value: "CRES", rank: 5 },
                    { name: "CROSSING", alias: ["CROSSING", "CRSSNG", "XING"], value: "XING", rank: 5 },
                    { name: "CROSSROAD", alias: ["CROSSROAD", "CROSSROADS"], value: "XRD", rank: 5 },
                    { name: "CROSSROADS", alias: ["CROSSROADS", "XRDS"], value: "XRDS", rank: 5 },
                    { name: "CURVE", alias: ["CURVE"], value: "CURV", rank: 5 },
                    { name: "DALE", alias: ["DALE", "DL"], value: "DL", rank: 5 },
                    { name: "DAM", alias: ["DAM", "DM"], value: "DM", rank: 5 },
                    { name: "DIVIDE", alias: ["DIV", "DIVIDE", "DV", "DVD"], value: "DV", rank: 5 },
                    { name: "DRIVE", alias: ["DR", "DRIV", "DRIVE", "DRV"], value: "DR", rank: 5 },
                    { name: "DRIVES", alias: ["DRIVES"], value: "DRS", rank: 5 },
                    { name: "ESTATE", alias: ["EST", "ESTATE"], value: "EST", rank: 5 },
                    { name: "ESTATES", alias: ["ESTATES", "ESTS"], value: "ESTS", rank: 5 },
                    { name: "EXPRESSWAY", alias: ["EXP", "EXPR", "EXPRESS", "EXPW", "EXPY", "EXPRESSWAY"], value: "EXPY", rank: 5 },
                    { name: "EXTENSION", alias: ["EXT", "EXTENSION", "EXTN", "EXTNSN"], value: "EXT", rank: 5 },
                    { name: "EXTENSIONS", alias: ["EXTS"], value: "EXTS", rank: 5 },
                    { name: "FALL", alias: ["FALL"], value: "FALL", rank: 5 },
                    { name: "FALLS", alias: ["FALLS", "FLS"], value: "FLS", rank: 5 },
                    { name: "FERRY", alias: ["FERRY", "FRRY", "FRY"], value: "FRY", rank: 5 },
                    { name: "FIELD", alias: ["FIELD", "FLD"], value: "FLD", rank: 5 },
                    { name: "FIELDS", alias: ["FLDS", "FIELDS"], value: "FLDS", rank: 5 },
                    { name: "FLAT", alias: ["FLAT", "FLT"], value: "FLT", rank: 5 },
                    { name: "FLATS", alias: ["FLATS", "FLTS"], value: "FLTS", rank: 5 },
                    { name: "FORD", alias: ["FORD", "FRD"], value: "FRD", rank: 5 },
                    { name: "FORDS", alias: ["FORDS", "FRDS"], value: "FRDS", rank: 5 },
                    { name: "FOREST", alias: ["FOREST", "FRST", "FORESTS"], value: "FRST", rank: 5 },
                    { name: "FORGE", alias: ["FORG", "FORGE", "FRG"], value: "FRG", rank: 5 },
                    { name: "FORGES", alias: ["FORGES"], value: "FRGS", rank: 5 },
                    { name: "FORK", alias: ["FORK", "FRK"], value: "FRK", rank: 5 },
                    { name: "FORKS", alias: ["FORKS", "FRKS"], value: "FRKS", rank: 5 },
                    { name: "FORT", alias: ["FORT", "FRT", "FT"], value: "FT", rank: 5 },
                    { name: "FREEWAY", alias: ["FREEWAY", "FREEWY", "FRWAY", "FRWY", "FWY"], value: "FWY", rank: 5 },
                    { name: "GARDEN", alias: ["GARDEN", "GARDN", "GRDEN", "GRDN"], value: "GDN", rank: 5 },
                    { name: "GARDENS", alias: ["GARDENS", "GDNS", "GRDNS"], value: "GDNS", rank: 5 },
                    { name: "GATEWAY", alias: ["GATEWAY", "GATEWY", "GATWAY", "GTWAY", "GTWY"], value: "GTWY", rank: 5 },
                    { name: "GLEN", alias: ["GLEN", "GLN"], value: "GLN", rank: 5 },
                    { name: "GLENS", alias: ["GLENS"], value: "GLNS", rank: 5 },
                    { name: "GREEN", alias: ["GREEN", "GRN"], value: "GRN", rank: 5 },
                    { name: "GREENS", alias: ["GREENS"], value: "GRNS", rank: 5 },
                    { name: "GROVE", alias: ["GROV", "GROVE", "GRV"], value: "GRV", rank: 5 },
                    { name: "GROVES", alias: ["GROVES"], value: "GRVS", rank: 5 },
                    { name: "HARBOR", alias: ["HARB", "HARBOR", "HARBR", "HBR", "HRBOR"], value: "HBR", rank: 5 },
                    { name: "HARBORS", alias: ["HARBORS"], value: "HBRS", rank: 5 },
                    { name: "HAVEN", alias: ["HAVEN", "HVN"], value: "HVN", rank: 5 },
                    { name: "HEIGHTS", alias: ["HT", "HTS"], value: "HTS", rank: 5 },
                    { name: "HIGHWAY", alias: ["HIGHWAY", "HIGHWY", "HIWAY", "HIWY", "HWAY", "HWY"], value: "HWY", rank: 5 },
                    { name: "HILL", alias: ["HILL", "HL"], value: "HL", rank: 5 },
                    { name: "HILLS", alias: ["HILLS", "HLS"], value: "HLS", rank: 5 },
                    { name: "HOLLOW", alias: ["HLLW", "HOLLOW", "HOLLOWS", "HOLW", "HOLWS"], value: "HOLW", rank: 5 },
                    { name: "INLET", alias: ["INLT"], value: "INLT", rank: 5 },
                    { name: "ISLAND", alias: ["IS", "ISLAND", "ISLND"], value: "IS", rank: 5 },
                    { name: "ISLANDS", alias: ["ISLANDS", "ISLNDS", "ISS"], value: "ISS", rank: 5 },
                    { name: "ISLE", alias: ["ISLE", "ISLES"], value: "ISLE", rank: 5 },
                    { name: "JUNCTION", alias: ["JCT", "JCTION", "JCTN", "JUNCTION", "JUNCTN", "JUNCTON"], value: "JCT", rank: 5 },
                    { name: "JUNCTIONS", alias: ["JCTNS", "JCTS", "JUNCTIONS"], value: "JCTS", rank: 5 },
                    { name: "KEY", alias: ["KEY", "KY"], value: "KY", rank: 5 },
                    { name: "KEYS", alias: ["KEYS", "KYS"], value: "KYS", rank: 5 },
                    { name: "KNOLL", alias: ["KNL", "KNOL", "KNOLL"], value: "KNL", rank: 5 },
                    { name: "KNOLLS", alias: ["KNLS", "KNOLLS"], value: "KNLS", rank: 5 },
                    { name: "LAKE", alias: ["LK", "LAKE"], value: "LK", rank: 5 },
                    { name: "LAKES", alias: ["LKS", "LAKES"], value: "LKS", rank: 5 },
                    { name: "LAND", alias: ["LAND", "LANDING"], value: "LAND", rank: 5 },
                    { name: "LANDING", alias: ["LNDG", "LNDNG"], value: "LNDG", rank: 5 },
                    { name: "LANE", alias: ["LANE", "LN"], value: "LN", rank: 5 },
                    { name: "LIGHT", alias: ["LGT", "LIGHT"], value: "LGT", rank: 5 },
                    { name: "LIGHTS", alias: ["LIGHTS"], value: "LGTS", rank: 5 },
                    { name: "LOAF", alias: ["LF", "LOAF"], value: "LF", rank: 5 },
                    { name: "LOCK", alias: ["LCK", "LOCK"], value: "LCK", rank: 5 },
                    { name: "LOCKS", alias: ["LCKS", "LOCKS"], value: "LCKS", rank: 5 },
                    { name: "LODGE", alias: ["LDG", "LDGE", "LODG", "LODGE"], value: "LDG", rank: 5 },
                    { name: "LOOP", alias: ["LOOP", "LOOPS"], value: "LOOP", rank: 5 },
                    { name: "MALL", alias: ["MALL"], value: "MALL", rank: 5 },
                    { name: "MANOR", alias: ["MNR", "MANOR"], value: "MNR", rank: 5 },
                    { name: "MANORS", alias: ["MANORS", "MNRS"], value: "MNRS", rank: 5 },
                    { name: "MEADOW", alias: ["MEADOW"], value: "MDW", rank: 5 },
                    { name: "MEADOWS", alias: ["MDW", "MDWS", "MEADOWS"], value: "MDWS", rank: 5 },
                    { name: "MEDOWS", alias: ["MEWS", "MEWS"], value: "MEWS", rank: 5 },
                    { name: "MILL", alias: ["MILL"], value: "ML", rank: 5 },
                    { name: "MILLS", alias: ["MILLS"], value: "MLS", rank: 5 },
                    { name: "MISSION", alias: ["MISSN", "MSSN"], value: "MSN", rank: 5 },
                    { name: "MOTORWAY", alias: ["MOTORWAY"], value: "MTWY", rank: 5 },
                    { name: "MOUNT", alias: ["MNT", "MT", "MOUNT"], value: "MT", rank: 5 },
                    { name: "MOUNTAIN", alias: ["MNTAIN", "MNTN", "MOUNTAIN", "MOUNTIN", "MTIN", "MTN"], value: "MTN", rank: 5 },
                    { name: "MOUNTAINS", alias: ["MNTNS", "MOUNTAINS"], value: "MTNS", rank: 5 },
                    { name: "NECK", alias: ["NCK", "NECK"], value: "NCK", rank: 5 },
                    { name: "ORCHARD", alias: ["ORCH", "ORCHARD", "ORCHRD"], value: "ORCH", rank: 5 },
                    { name: "OVAL", alias: ["OVAL", "OVL"], value: "OVAL", rank: 5 },
                    { name: "OVERPASS", alias: ["OVERPASS"], value: "OPAS", rank: 5 },
                    { name: "PARK", alias: ["PARK", "PRK"], value: "PARK", rank: 5 },
                    { name: "PARKS", alias: ["PARKS"], value: "PARK", rank: 5 },
                    { name: "PARKWAY", alias: ["PARKWAY", "PARKWY", "PKWAY", "PKWY", "PKY"], value: "PKWY", rank: 5 },
                    { name: "PARKWAYS", alias: ["PARKWAYS", "PKWYS"], value: "PKWY", rank: 5 },
                    { name: "PASS", alias: ["PASS", "PASSAGE", "PASSAGE", "PSGE"], value: "PASS", rank: 5 },
                    { name: "PATH", alias: ["PATH", "PATHS"], value: "PATH", rank: 5 },
                    { name: "PIKE", alias: ["PIKE", "PIKES"], value: "PIKE", rank: 5 },
                    { name: "PINE", alias: ["PINE"], value: "PNE", rank: 5 },
                    { name: "PINES", alias: ["PINES", "PNES"], value: "PNES", rank: 5 },
                    { name: "PLACE", alias: ["PL"], value: "PL", rank: 5 },
                    { name: "PLAIN", alias: ["PLAIN", "PLN"], value: "PLN", rank: 5 },
                    { name: "PLAINS", alias: ["PLAINS", "PLNS"], value: "PLNS", rank: 5 },
                    { name: "PLAZA", alias: ["PLAZA", "PLZ", "PLZA"], value: "PLZ", rank: 5 },
                    { name: "POINT", alias: ["POINT", "PT"], value: "PT", rank: 5 },
                    { name: "POINTS", alias: ["POINTS", "PTS"], value: "PTS", rank: 5 },
                    { name: "PORT", alias: ["PORT", "PRT"], value: "PRT", rank: 5 },
                    { name: "PORTS", alias: ["PORTS", "PRTS"], value: "PRTS", rank: 5 },
                    { name: "PRAIRIE", alias: ["PR", "PRAIRIE", "PRR"], value: "PR", rank: 5 },
                    { name: "RADIAL", alias: ["RAD", "RADIAL", "RADIEL", "RADL"], value: "RADL", rank: 5 },
                    { name: "RAMP", alias: ["RAMP"], value: "RAMP", rank: 5 },
                    { name: "RANCH", alias: ["RANCH", "RNCHS", "RNCH", "RANCHES"], value: "RNCH", rank: 5 },
                    { name: "RAPID", alias: ["RAPID", "RPD"], value: "RPD", rank: 5 },
                    { name: "RAPIDS", alias: ["RAPIDS", "RPDS"], value: "RPDS", rank: 5 },
                    { name: "REST", alias: ["REST", "RST"], value: "RST", rank: 5 },
                    { name: "RIDGE", alias: ["RDG", "RDGE", "RIDGE"], value: "RDG", rank: 5 },
                    { name: "RIDGES", alias: ["RDGS", "RIDGES"], value: "RDGS", rank: 5 },
                    { name: "RIVER", alias: ["RIV", "RIVER", "RVR", "RIVR"], value: "RIV", rank: 5 },
                    { name: "ROAD", alias: ["RD", "ROAD"], value: "RD", rank: 5 },
                    { name: "ROADS", alias: ["ROADS", "RDS"], value: "RDS", rank: 5 },
                    { name: "ROUTE", alias: ["ROUTE"], value: "RTE", rank: 5 },
                    { name: "ROW", alias: ["ROW"], value: "ROW", rank: 5 },
                    { name: "RUE", alias: ["RUE"], value: "RUE", rank: 5 },
                    { name: "RUN", alias: ["RUN"], value: "RUN", rank: 5 },
                    { name: "SHOAL", alias: ["SHL", "SHOAL"], value: "SHL", rank: 5 },
                    { name: "SHOALS", alias: ["SHLS", "SHOALS"], value: "SHLS", rank: 5 },
                    { name: "SHORE", alias: ["SHOAR", "SHORE", "SHR"], value: "SHR", rank: 5 },
                    { name: "SHORES", alias: ["SHOARS", "SHORES", "SHRS"], value: "SHRS", rank: 5 },
                    { name: "SKYWAY", alias: ["SKYWAY"], value: "SKWY", rank: 5 },
                    { name: "SPRING", alias: ["SPG", "SPNG", "SPRING", "SPRNG"], value: "SPG", rank: 5 },
                    { name: "SPRINGS", alias: ["SPGS", "SPNGS", "SPRINGS", "SPRNGS"], value: "SPGS", rank: 5 },
                    { name: "SPUR", alias: ["SPUR"], value: "SPUR", rank: 5 },
                    { name: "SPURS", alias: ["SPURS"], value: "SPUR", rank: 5 },
                    { name: "SQUARE", alias: ["SQ", "SQR", "SQRE", "SQU", "SQUARE"], value: "SQ", rank: 5 },
                    { name: "SQUARES", alias: ["SQRS", "SQUARES"], value: "SQS", rank: 5 },
                    { name: "STATION", alias: ["STA", "STATION", "STATN", "STN"], value: "STA", rank: 5 },
                    { name: "STRAVENUE", alias: ["STRA", "STRAV", "STRAVEN", "STRAVENUE", "STRAVN", "STRVN", "STRVNUE"], value: "STRA", rank: 5 },
                    { name: "STREAM", alias: ["STREAM", "STREME", "STRM"], value: "STRM", rank: 5 },
                    { name: "STREET", alias: ["STREET", "STRT", "ST", "STR", "STREETS", "STREETS", "STS"], value: "ST", rank: 5 },
                    { name: "SUMMIT", alias: ["SMT", "SUMIT", "SUMITT", "SUMMIT"], value: "SMT", rank: 5 },
                    { name: "TERRACE", alias: ["TER", "TERR", "TERRACE"], value: "TER", rank: 5 },
                    { name: "THROUGHWAY", alias: ["THROUGHWAY"], value: "TRWY", rank: 5 },
                    { name: "TRACE", alias: ["TRACE", "TRCE", "TRACES"], value: "TRCE", rank: 5 },
                    { name: "TRACK", alias: ["TRACK", "TRACKS", "TRAK", "TRK", "TRKS"], value: "TRAK", rank: 5 },
                    { name: "TRAFFICWAY", alias: ["TRAFFICWAY"], value: "TRFY", rank: 5 },
                    { name: "TRAIL", alias: ["TRAIL", "TRL", "TRAILS", "TRLS"], value: "TRL", rank: 5 },
                    { name: "TRAILER", alias: ["TRAILER", "TRLR", "TRLRS"], value: "TRLR", rank: 5 },
                    { name: "TUNNEL", alias: ["TUNEL", "TUNL", "TUNLS", "TUNNEL", "TUNNELS", "TUNNL"], value: "TUNL", rank: 5 },
                    { name: "TURNPIKE", alias: ["TRNPK", "TURNPIKE", "TURNPK"], value: "TPKE", rank: 5 },
                    { name: "UNDERPASS", alias: ["UNDERPASS"], value: "UPAS", rank: 5 },
                    { name: "UNION", alias: ["UN", "UNION"], value: "UN", rank: 5 },
                    { name: "UNIONS", alias: ["UNIONS"], value: "UNS", rank: 5 },
                    { name: "VALLEY", alias: ["VALLEY", "VALLY", "VLLY", "VLY"], value: "VLY", rank: 5 },
                    { name: "VALLEYS", alias: ["VALLEYS", "VLYS"], value: "VLYS", rank: 5 },
                    { name: "VIADUCT", alias: ["VDCT", "VIA", "VIADCT", "VIADUCT"], value: "VIA", rank: 5 },
                    { name: "VIEW", alias: ["VIEW", "VW"], value: "VW", rank: 5 },
                    { name: "VIEWS", alias: ["VIEWS", "VWS"], value: "VWS", rank: 5 },
                    { name: "VILLAGE", alias: ["VILL", "VILLAG", "VILLAGE", "VILLG", "VILLIAGE", "VLG"], value: "VLG", rank: 5 },
                    { name: "VILLAGES", alias: ["VILLAGES", "VLGS", "VILLE", "VILLE", "VL", "VL"], value: "VLGS", rank: 5 },
                    { name: "VISTA", alias: ["VIS", "VIST", "VISTA", "VST", "VSTA"], value: "VIS", rank: 5 },
                    { name: "WALK", alias: ["WALK", "WALKS", "WALKS", "WALK"], value: "WALK", rank: 5 },
                    { name: "WALL", alias: ["WALL"], value: "WALL", rank: 5 },
                    { name: "WAY", alias: ["WY", "WAY"], value: "WAY", rank: 5 },
                    { name: "WAYS", alias: ["WAYS"], value: "WAYS", rank: 5 },
                    { name: "WELL", alias: ["WELL"], value: "WL", rank: 5 },
                    { name: "WELLS", alias: ["WELLS", "WLS"], value: "WLS", rank: 5 }
                ];
                deferred.resolve(service.commonData.getUnitTypes);
            } else {
                //We Already have the list just return it.
                deferred.resolve(service.commonData.getUnitTypes);
            }
            return deferred.promise;
        }

        //this runtion will init the common data by prefetching the data if it hasn't already been fetched
        //If two controls on the page call this function only the first will fetch the rest will be cached
        //Controls should try to use the commonData Object in there NG-Repeats so that the objects are single instanced
        service.initCommonData = function () {
            $log.debug('addressService initCommonData');
            var deferred = $q.defer();

            $q.all([
                 service.getStates(),
                 service.getStreetDirections(),
                 service.getStreetSuffixes(),
                 service.getUnitTypes(),
                 service.getAddressTypes()
            ]).then(function (result) {
                deferred.resolve(result);
            },
            function (result) {
                deferred.reject(result);
            }
            );

            return deferred.promise;
        }

        return service;
    }])
})();