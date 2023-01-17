
db.createCollection( "ut_RefreshToken")

db.ut_RefreshToken.createIndex( { "expiresOn": 1 }, { expireAfterSeconds: 0 } )

db.ut_RefreshToken.createIndex( { "refresh_token": 1 }, { unique: true } )

db.createCollection( "ut_AccessToken")

db.ut_AccessToken.createIndex( { "expiresOn": 1 }, { expireAfterSeconds: 0 } )

db.ut_AccessToken.createIndex( { "access_token": 1 } , { unique: true } )
db.ut_AccessToken.createIndex( { "refresh_token": 1 } )

db.createCollection( "ut_PageContent")

db.ut_PageContent.createIndex( { "pageContentGuid": 1 } )

db.createCollection("ut_DeviceDetails")




