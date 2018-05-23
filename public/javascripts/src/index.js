//jQuery
import $ from "jquery";
import jQuery from "jquery";
//Bootstrap
import 'bootstrap';

//Font Awesome
import fontawesome from '@fortawesome/fontawesome'
import solid from '@fortawesome/fontawesome-free-solid'
import regular from '@fortawesome/fontawesome-free-regular'
import brands from '@fortawesome/fontawesome-free-brands'
//Add Solid, Regular and Brands Icons
fontawesome.library.add(solid);
fontawesome.library.add(regular);
fontawesome.library.add(brands);

/** Just making $ and jQuery externally available for debug puporses. */
//window.$ = $;
//window.jQuery = jQuery;

function update() {
    $('.secret').each(function () {
        let text = '';
        if ($(this).data('hide')) {
            text = hideText($(this).data('secret'));
        } else {
            text = $(this).data('secret');
        }
        $(this).text(text);
    });
    function hideText(text) {
        return '\u25CF'.repeat(text.length);
    }
}

function init() {
    $('.secret-hide-toggle').click(function () {
        if ($(this).siblings('.secret').data('hide')) {
            $(this).siblings('.secret').data('hide', false);
        } else {
            $(this).siblings('.secret').data('hide', true);
        }
        update();
    });
    update();
}

init();