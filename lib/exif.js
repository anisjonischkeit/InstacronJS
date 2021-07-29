var ExifImage = require('exif').ExifImage;
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });


exports.getMetadata = async (buf) => {
    return new Promise((resolve, reject) => {
        try {
            new ExifImage({ image : buf }, function (error, exifData) {
                if (error)
                    reject(error)
                else
                    resolve(exifData);
            });
        } catch (error) {
            reject('Error: ' + error.message);
        }
    })
}

const getGPSLocation = (exif) => {
    function ConvertDMSToDD(degrees, minutes, seconds, direction) {
        var dd = degrees + (minutes/60) + (seconds/360000);
        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        }
        return dd;
    }

    // get latitude from exif data and calculate latitude decimal
    var latDegree = exif.gps.GPSLatitude[0];
    var latMinute = exif.gps.GPSLatitude[1];
    var latSecond = exif.gps.GPSLatitude[2];
    var latDirection = exif.gps.GPSLatitudeRef;

    var latFinal = ConvertDMSToDD(latDegree, latMinute, latSecond, latDirection);
    //console.log(latFinal);

    // get longitude from exif data and calculate longitude decimal
    var lonDegree = exif.gps.GPSLongitude[0];
    var lonMinute = exif.gps.GPSLongitude[1];
    var lonSecond = exif.gps.GPSLongitude[2];
    var lonDirection = exif.gps.GPSLongitudeRef;
    
    var lonFinal = ConvertDMSToDD(lonDegree, lonMinute, lonSecond, lonDirection);
    //console.log(lonFinal);

    return {lat: latFinal, lon: lonFinal};
}
exports.getGPSLocation = getGPSLocation

exports.getGeocodedLocation = async (exif) => {
    const location = getGPSLocation(exif)

    return new Promise((resolve, reject) => {
        geocoder.reverse(location, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data[0])
            }
        })
    })
}

exports.getDate = (exif) => {
    const str = exif.image.ModifyDate.split(" ");
    //get date part and replace ':' with '-'
    const dateStr = str[0].replace(/:/g, "-");
    //concat the strings (date and time part)
    const properDateStr = dateStr + " " + str[1];
    //pass to Date
    const d = new Date(properDateStr);
    return d
}