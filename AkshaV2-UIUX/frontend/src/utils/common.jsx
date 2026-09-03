// This code defines an object called isMobile that has several methods to check if the device accessing the web page is a mobile device or not.

// The methods are:

// Android(): Returns true if the device is an Android device, false otherwise.
// BlackBerry(): Returns true if the device is a BlackBerry device, false otherwise.
// iOS(): Returns true if the device is an iOS device (iPhone, iPad, or iPod), false otherwise.
// Opera(): Returns true if the device is using the Opera Mini browser, false otherwise.
// Windows(): Returns true if the device is a Windows mobile device, false otherwise.
// any(): Returns true if the device matches any of the above types (Android, BlackBerry, iOS, Opera Mini, or Windows), false otherwise.

// Each method uses the navigator.userAgent property to check the user agent string of the device and match it against a regular expression. 
// The regular expressions are specific to each device type and are used to determine if the device is of that type.


export const isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};