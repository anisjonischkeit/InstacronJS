const Instagram = require('instagram-web-api')
const Dropbox = require('dropbox')
const fetch = require('node-fetch')
const emoji = require('random-unicode-emoji');
const exif = require('./exif');
const flagEmoji = require('country-emoji').flag;

const getPhoto = async (dbx) => {
    const files = (await dbx.filesListFolder({path: ''})).result.entries
    const uploadedFiles = (await dbx.filesListFolder({path: '/uploaded'})).result.entries
    const photoToUpload = files.find(file => 
        file[".tag"] == "file" &&
            uploadedFiles.every(
                uploadedFile => uploadedFile.name != file.name
            )
    )
    if (!photoToUpload) {
        return null
    }

    const photo = await dbx.filesDownload({path: photoToUpload.id})
    return photo.result
}

const getQuote = async () => {
    return fetch('https://api.quotable.io/random')
        .then(response => response.json())
}

const makeCaption = async (photo) => {
    const quote = await getQuote()
    const emojis = emoji.random({count: 2})
    const metadata = await exif.getMetadata(photo)
    const location = await exif.getGeocodedLocation(metadata)
    const date = exif.getDate(metadata)

    const quoteTxt = `${quote.content} ${emojis.join('')}`
    const locationTxt = `Taken in ${location.city}, ${location.state}, ${location.country} ${flagEmoji(location.countryCode)}`
    const dateTxt = `on ${date.toLocaleDateString('en-AU', {
        weekday: 'long', // long, short, narrow
        day: 'numeric', // numeric, 2-digit
        year: 'numeric', // numeric, 2-digit
        month: 'long', // numeric, 2-digit, long, short, narrow
    })}`
    return `${quoteTxt} ${locationTxt} ${dateTxt}`
}

const upload = async (client, photo, caption, uploadCallback) => {
    console.log("login")
    await client.login()
    console.log("upload")
    await client.uploadPhoto({photo: photo.fileBinary, caption: caption})
    await uploadCallback(photo)

    // console.log("logout")
    // await client.logout()
}

const markFileAsUploaded = async (client, photo) => {
    console.log("saving as uploaded")
    await client.filesCopyV2({from_path: photo.path_display, to_path: `/uploaded${photo.path_display}`})
}

const run = async () => {
    console.log("running instacron")
    const { 
        IG_USERNAME: username, 
        IG_PASSWORD: password, 
        DROPBOX_TOKEN: dbxtoken 
    } = process.env
    
    const ig = new Instagram({ username, password })
    const dbx = new Dropbox.Dropbox({ accessToken: dbxtoken });

    console.log("get photo")
    const photo = await getPhoto(dbx)
    if (!photo) {
        console.log("no photo found that wasn't already uploaded")
        return null
    }

    console.log("make caption")
    const bin = await photo.fileBinary
    const caption = await makeCaption(bin)
    try {
        await upload(ig, photo, caption, markFileAsUploaded.bind(null, dbx))
    } catch (error) {
        console.error(error);
    }
}

exports.run = run
