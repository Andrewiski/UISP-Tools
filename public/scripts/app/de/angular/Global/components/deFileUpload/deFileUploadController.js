'use strict';

angular.module('deapp')
    .controller('deFileUploadController', [
        '$scope', '$location', 'FileUploader', function ($scope, $location, FileUploader) {
            var uploader = $scope.uploader = new FileUploader({
                url: '/api/PDFSignature/Upload',
                errors: []
            });
            console.info('de upload controller called');
            $scope.selected = undefined;

            $scope.goBack = function () {
                $scope.isUploading = false;
                $scope.isFinished = false;
                $scope.uploader.clearQueue();

                if ($.jang && $.jang.uploadOptions && $.jang.uploadOptions.doneCallback) {
                    return $.jang.uploadOptions.doneCallback();
                }

                var callbackStr = getUrlParameter('callback');                

                if (callbackStr) {
                    // Look for the callback function in the current document
                    if (document[callbackStr]) {
                        document[callbackStr]();
                    }
                    // If page was loaded in a frame, the callback may exist in the parent window
                    if (window.parent[callbackStr]) {
                        window.parent[callbackStr]();
                    }
                }
                
            };

            $scope.uploadAll = function () {                
                $scope.isUploading = true;
                $scope.uploader.uploadAll();
            }       

            $scope.contractTemplates = [
                { name: 'Agreement To Amend-Extend Contract With Broker' },
                { name: 'Brokerage Disclosure To Buyer' },
                { name: 'Change Of Status' },
                { name: 'Closing Instructions' },
                { name: 'Colorado Mold Disclosure' },
                { name: 'COMMON INTEREST COMMUNITY CHECKLIST FOR BROKERAGE FIRM' },
                { name: 'Contract To Buy And Sell Real Estate - Residential' },
                { name: 'Contract To Buy And Sell Real Estate - Income-Residential' },
                { name: 'Contract To Buy And Sell Real Estate - Commercial' },
                { name: 'Contract To Buy And Sell Real Estate - Land' },
                { name: 'Contract To Buy And Sell Real Estate - Foreclosure' },
                { name: 'Counterproposal' },
                { name: 'Definitions Of Working Relationships' },
                { name: 'EARNEST MONEY PROMISSORY NOTE' },
                { name: 'EARNEST MONEY RELEASE' },
                { name: 'Exclusive Right To Sell Listing Contract' },
                { name: 'Exclusive Right To Buy Contract' },
                { name: 'FORECLOSURE PROPERTY ADDENDUM TO CONTRACT TO BUY AND SELL REAL ESTATE' },
                { name: 'Inspection Notice' },
                { name: 'INSPECTION RESOLUTION' },
                { name: 'HOMEOWNER WARNING NOTICE - Right to Cancel' },
                { name: 'HUD' },
                { name: 'Lead-Based Paint Disclosure (sales)' },
                { name: 'Lead-Based Paint Obligations of Seller' },
                { name: 'LICENSEE BUY-OUT ADDENDUM TO CONTRACT TO BUY AND SELL REAL ESTATE' },
                { name: 'LISTING FIRM\'S WELL CHECKLIST' },
                { name: 'NOTICE OF CANCELLATION' },
                { name: 'RESIDENTIAL ADDENDUM TO CONTRACT TO BUY AND SELL REAL ESTATE' },
                { name: 'Seller\'s Property Disclouse' },
                { name: 'Square Footage Disclosure' },
                { name: 'Title Commitment' },
                { name: 'Title Order' }
            ];

            $scope.formatFilename = function (filename) {
                if (filename.length > 28) {
                    var prefix = filename.lastIndexOf('.') - 1;
                    var extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
                    var filenameWithoutExt = filename.substring(0, prefix - 3);
                    filenameWithoutExt = filenameWithoutExt.substring(0, 28);
                    filenameWithoutExt += '..';
                    filename = filenameWithoutExt + extension;
                    return filename;
                } else {
                    return filename;
                }
            }

            // FILTERS
            uploader.filters.push({
                name: 'quantityFilter',
                fn: function (item /*{File|FileLikeObject}*/, options) {
                    return this.queue.length < 10;
                }
            });

            // EXTENSION
            //we want to make sure that both 1) the file has an extension, and 2) the extension is an extension of an allowed type
            //we can't check by mime type on the client, as the browser's determination of mime is strictly by file extension, and even
            //then is not consistent in all of our allowed cases.
            //note: on the client (here) we are validating by extension; on the server, we are mime-type sniffing based on actual data, and
            //on the server if the mimetype as we determine it is not an allowed contenttype, then the upload is rejected

            uploader.filters.push({
                name: 'extensionFilter',
                fn: function (item, options) {
                    //console.log('name: ' + item.name);
                    if (item.name !== "" && item.name !== undefined) {
                        var extension = '|' + item.name.slice(item.name.lastIndexOf('.') + 1).toLowerCase() + '|';
                        //console.log('extension: ' + extension);
                        return '|ppt|pptx|pdf|txt|csv|xls|xlsx|doc|docx|jpg|jpeg|gif|tif|png|bmp|mht|'.indexOf(extension) !== -1;
                    } else {
                        return false;
                    }
                }
            });

            // FILE SIZE
            uploader.filters.push({
                name: 'sizeFilter',
                fn: function (item, options) {
                    var size = item.size;
                    //console.log("size:" + item.size);

                    //1,000,000 bytes = 1 megabyte
                    return item.size < 12000000;
                }
            });

            uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
                var reason = "";
                //console.log('filter:' + filter.name);
                switch (filter.name) {
                    case "sizeFilter":
                        reason = "Maximum file size (12MB) exceeded.";
                        break;
                    case "extensionFilter":
                        reason = "Invalid file type.";
                        break;
                    case "quantityFilter":
                        reason = "Maximum number of items per queue (10) exceeded.";
                        break;
                }

                new PNotify({
                    title: 'Error',
                    text: item.name + ' not added to queue. ' + reason,
                    type: 'error',
                    delay: 2000
                });

                uploader.errors.push(item.name + ' not added to queue. ' + reason);
                //console.info('onWhenAddingFileFailed', item, filter, options);
            };

            uploader.onAfterAddingFile = function (fileItem) {
                //console.info('onAfterAddingFile', fileItem);
            };
            uploader.onAfterAddingAll = function (addedFileItems) {
                //console.info('onAfterAddingAll', addedFileItems);
            };
            uploader.onBeforeUploadItem = function (item) {                
                var index = uploader.getIndexOfItem(item),                
                    custguid = getUrlParameter('cu2') || '',
                    isTemplate = 0;

                //If options was passed in, check it
                if ($scope.options && $scope.options.hasOwnProperty('isTemplate')) {
                    isTemplate = $scope.options.isTemplate;
                }
                
                item.formData.push({ RenamedValue: item.file.alias || item.file.name });
                item.formData.push({ CustomerGuid: custguid });
                item.formData.push({ IsTemplate: isTemplate });

                //console.info('onBeforeUploadItem', item);
            };
            uploader.onProgressItem = function (fileItem, progress) {
                //console.info('onProgressItem', fileItem, progress);
            };
            uploader.onProgressAll = function (progress) {
                //console.info('onProgressAll', progress);
            };
            uploader.onSuccessItem = function (fileItem, response, status, headers) {
                //console.info('onSuccessItem', fileItem, response, status, headers);
            };
            uploader.onErrorItem = function (fileItem, response, status, headers) {
                fileItem.errorMessage = 'Could not upload ' + fileItem.file.name + ' - ' + response.returnData;                
                uploader.errors.push(fileItem.file.name + ' not uploaded. Reason: ' + response.returnData + '.');
                // console.info('onErrorItem', fileItem, response, status, headers);
            };
            uploader.onCancelItem = function (fileItem, response, status, headers) {
                //console.info('onCancelItem', fileItem, response, status, headers);
            };
            uploader.onCompleteItem = function (fileItem, response, status, headers) {
                //console.info('onCompleteItem', fileItem, response, status, headers);
            };
            uploader.onCompleteAll = function () {
                //console.info('onCompleteAll');
                $scope.isFinished = true;
                if(uploader.errors.length === 0) {
                    new PNotify({
                        title: 'Success',
                        text: 'Files Uploaded',
                        type: 'success',
                        delay: 2000
                    });

                }
            };

            //console.info('uploader', uploader);

            var getUrlParameter = function (sParam) {
                var sPageURL = window.location.search.substring(1);
                var sURLVariables = sPageURL.split('&');
                for (var i = 0; i < sURLVariables.length; i++) {
                    var sParameterName = sURLVariables[i].split('=');
                    if (sParameterName[0].toLowerCase() == sParam.toLowerCase()) {
                        return decodeURI(sParameterName[1]);
                    }
                }
            }

        }]);
