/*
 * An example log properties file.  This works like log4j properties, and Javascript ports of it,
 * only simpler.
 *
 */
mjs.config.logging = {
    //logger: 'mjs/logging/AlertLogger',
    //pattern: "%d{yyyy-MM-dd HH:mm} [%M] %p%-5l - %m%n",
    pattern: "%d [%M] %p%-5l - %m%n",
    //pattern: "[%M]%l............%m%-5F",
    firstModule: "INFO",
    PretendClass: "LOG"
};