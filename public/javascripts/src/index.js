//jQuery
import $ from "jquery";
import jQuery from "jquery";
//Bootstrap
import 'bootstrap';

//Font Awesome
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fas, far, fab);
dom.watch();

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