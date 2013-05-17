/**
 * kGallery
 *
 * @version 1.1.0 / 17.05.2013
 * @author Andrew Kondratev [andr@kopolo.ru]
 * @requires jQuery JavaScript Library > v1.3.2
 * @requires kSlideshow >= 1.2.0
 * @requires kThumbnailPicker >= 1.1.0
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * https://github.com/andruhon/kGallery
 */
function kGallery(new_options) {

    window.kGalleryVersion = '1.1.0';

    /**
     * Default options
     * @memberOf kGallery
     */
    var defaults = {
            /**
             * gallery wrapper
             * If collection of elements given, displays the same slideshow obeying same commands in all wrappers
             * Call new kSlideshow to create independent slideshow
             * var string|$.object
             */
            wrapper: '#gallery-wrapper',

            /**
             * Url with the data for gallery (JSON usually)
             * see jQuery.ajax()
             * var string
             */
            url: 'data.json',

            /**
             * Data type
             * see jQuery.ajax()
             * var string
             */
            dataType: 'json',

            /**
             * index of initial slide
             * var integer
             */
            startItem: 0,

            /**
             * Additional settings for kSlideshow
             * var object
             */
            slideshowOptions: {},

            /**
             * Additional settings for kThumbnailPicker
             * var object
             */
            thumbnailPickerOptions: {},

            /**
             * CSS class, which adds to gallery wrapper
             * var string
             */
            wrapperClass: 'kGallery',

            /**
             * CSS class, which adds to selected thumbnail
             * var string
             */
            selectedThumbnailClass: 'selectedThumbnail',

            /**
             * Function, which calls after initialization
             * var function
             */
            afterInit: function () {},

            /**
             * Function, which calls before displaying of picture
             */
            beforeShow: function (itemIndex) {}
    };

    /**
     * Link to itself, available anywhere inside class
     * It can be used like class::this operator even inside of asynchronous methods, which has their own this
     */
    var instance = {};

    /**
     * Result of megring of user options and default options, available anywhere inside the class
     * var object
     * var object
     */
    var options;

    /**
     * This instance index
     */
    instance.index = null;

    /**
     * Array with list of items received from data (see url option)
     * var array
     */
    instance.items = [];

    /**
     * jQuery object of wrapper element
     * var object
     */
    instance.wrapper;

    /**
     * Object of kSlideshow (with all methods)
     * var object
     */
    instance.slideshow;

    /**
     * Object of kThumbnailPicker (with all methods)
     * var object
     */
    instance.thumbnailsPicker;

    /**
     * DOM node of last selected thumbnail
     * var object
     */
    instance.lastThumbnail;

    /**
     * "Constructor"
     */
    {
        if (typeof new_options === 'string' || new_options instanceof jQuery || (typeof new_options === 'object' && new_options.nodeType) ) {
            /* try to find existing instance if options is only CSS seletor jQuery object or HTMLElement */
            var prevInstance = jQuery(new_options).data('kGalleryInstance');
            if (prevInstance) {
                /* return instance if it is found */
                return prevInstance;
            }
        }
        if (typeof new_options !== 'object' || !new_options.url) {
            /* now you cannot initialize kGallery without url */
            return false;
        }
        setOptions(new_options);
        /*
         * recieveng the data for slideshow
         */
        jQuery.ajax({
            url: options.url,
            success: function (data) {
                var items = data.items;
                instance.items = items;
                instance.init ();
                options.afterInit();
            },
            dataType: options.dataType
        });
    };

    /**
     * megring of user options and default options
     * @param object new_options
     * @memberOf kGallery
     */
    function setOptions(new_options) {
        options = jQuery.extend({}, defaults, options, new_options);
    };

    /**
     * Initialization of gallery
     */
    instance.init = function () {
        instance.wrapper = jQuery(options.wrapper);
        var prevInstance = instance.wrapper.data('kGalleryInstance');
        if (prevInstance) {
            prevInstance.destroy();
        }
        instance.wrapper.addClass(options.wrapperClass);
        instance.initSlideshow();
        instance.initThumbnailPicker();
        instance.wrapper.data('kGalleryInstance',instance);
    };

    /**
     * Destroy this instance
     */
    instance.destroy = function () {

    };

    /**
     * Initialization of thumbnails
     */
    instance.initThumbnailPicker = function () {
        /* general options for thumbnails */
        var thumbnailPickerDefaults = {
                url: false,
                startItem: options.startItem
        };
        if (!options.thumbnailPickerOptions.wrapper){
            /* Creating thumbnails wrapper if it is not given in options */
            thumbnailPickerDefaults.wrapper = jQuery('<div></div>').appendTo(instance.wrapper);
        };
        thumbnailPickerDefaults.thumbnailClick = function (itemIndex) {
            /* on thumbnail click display in slideshow according picture */
            if (instance.slideshow && itemIndex != instance.slideshow.currentItemIndex) {
                instance.slideshow.showItem(itemIndex);
            };
        };
        thumbnailPickerDefaults.beforeShow = function (nextOrPrev) {
            /* reset slideshow playback iterval if thumbnails next or prev button is pressed */
            if (instance.slideshow.isPlay==true) {
               instance.slideshow.play();
            }
        };

        /* initialization of preview */
        var thumbnailPickerOptions = jQuery.extend({},thumbnailPickerDefaults,options.thumbnailPickerOptions);
        instance.thumbnailPicker = kThumbnailPicker(thumbnailPickerOptions);
        instance.thumbnailPicker.items = instance.items;
        instance.thumbnailPicker.init();
        if (instance.thumbnailPicker.items[options.startItem] && instance.thumbnailPicker.items[options.startItem].thumbnailNode) {
            /* highlighting of initial preview */
            instance.lastThumbnail = instance.thumbnailPicker.items[options.startItem].thumbnailNode;
            instance.lastThumbnail.addClass(options.selectedThumbnailClass);
        };
    };

    /**
     * Initialization of slideshow
     */
    instance.initSlideshow = function () {
        /* general slidesohw options */
        var slideshowDefaults = {
                url: false,
                startItem: options.startItem
        };
        if (!options.slideshowOptions.wrapper) {
            /* Creating slideshow wrapper if it is not given in options */
            slideshowDefaults.wrapper = jQuery('<div></div>').appendTo(instance.wrapper)
        };
        /* event before changing of picture */
        slideshowDefaults.beforeShow = function (itemIndex) {
            options.beforeShow(itemIndex);
            if (instance.thumbnailPicker) {
                if (instance.thumbnailPicker.items[itemIndex].thumbnailNode) {
                    /* highlightning of selected preview */
                    instance.thumbnailPicker.items[itemIndex].thumbnailNode.addClass(options.selectedThumbnailClass);
                    instance.lastThumbnail.removeClass(options.selectedThumbnailClass);
                    instance.lastThumbnail = instance.thumbnailPicker.items[itemIndex].thumbnailNode;
                };
            };
        };
        /* event after changing of picture */
        slideshowDefaults.afterShow = function (){
            /* trying to flip to according page of thumbnails */
            if (instance.thumbnailPicker) {
                instance.thumbnailPicker.showItem(instance.slideshow.currentItemIndex);
            };
        };

        /*  initialization of slideshow */
        var slideshowOptions = jQuery.extend({},slideshowDefaults,options.slideshowOptions);
        instance.slideshow = kSlideshow(slideshowOptions);
        instance.slideshow.items = instance.items;
        instance.slideshow.init();
    };

    /**
     * Destroy this instance
     */
    instance.destroy = function() {
        instance.slideshow.destroy();
        instance.thumbnailPicker.destroy();
    };

    return instance;
};

/**
 * Plugin
 * @param string|object - url|options
 */
jQuery.fn.kGallery = function(urlOrOptions) {
    var options = {};
    if (typeof urlOrOptions === 'string') {
        /* string is supposed to be url */
        options.url = urlOrOptions;
        options.wrapper = jQuery(this);
    } else if (typeof urlOrOptions === 'object') {
        /* options object */
        options = urlOrOptions;
        options.wrapper = jQuery(this);
    } else if (typeof urlOrOptions === 'undefined') {
        options = $(this);
    }
    return kGallery(options);
};