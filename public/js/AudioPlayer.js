class AudioPlayer extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
        <style>
            fieldset {
                border: 0;
            }
            #volume {
                width: 4em;
            }
        </style>
        <audio></audio>
        <fieldset id="controls">
            <label for="volume">&#x1F50A;</label>
            <input id="volume" type="number" value="100" step="1" min="0" max="100" />
        </fieldset>
`;
        this.audio = shadow.querySelector('audio');

        const volume = shadow.querySelector('#volume');
        const volumeLabel = shadow.querySelector('label[for="volume"]');
        volume.addEventListener('input', e => {
            this.audio.volume = volume.value / 100;
        });
        volumeLabel.addEventListener('click', e => {
            this.audio.muted = !this.audio.muted;
        });
        this.audio.addEventListener('volumechange', e => {
            volume.value = Math.round(this.audio.volume * 100);
            if (this.audio.volume <= 0 || this.audio.muted) {
                volumeLabel.innerHTML = '&#x1F507;';
            } else {
                volumeLabel.innerHTML = '&#x1F50A;';
            }
        });

        // No way in Chrome to get all possible audio properties
        const audioProps = ["load", "canPlayType", "fastSeek", "play", "pause", "addTextTrack", "mozCaptureStream", "mozCaptureStreamUntilEnded", "mozGetMetadata", "setMediaKeys", "seekToNextFrame", "error", "src", "currentSrc", "crossOrigin", "networkState", "preload", "buffered", "readyState", "seeking", "currentTime", "duration", "paused", "defaultPlaybackRate", "playbackRate", "played", "seekable", "ended", "autoplay", "loop", "controls", "volume", "muted", "defaultMuted", "textTracks", "srcObject", "mozPreservesPitch", "mozAudioCaptured", "mozFragmentEnd", "mediaKeys", "onencrypted", "onwaitingforkey", "NETWORK_EMPTY", "NETWORK_IDLE", "NETWORK_LOADING", "NETWORK_NO_SOURCE", "HAVE_NOTHING", "HAVE_METADATA", "HAVE_CURRENT_DATA", "HAVE_FUTURE_DATA", "HAVE_ENOUGH_DATA", "click", "focus", "blur", "title", "lang", "dir", "innerText", "hidden", "accessKey", "accessKeyLabel", "draggable", "contentEditable", "isContentEditable", "spellcheck", "nonce", "offsetParent", "offsetTop", "offsetLeft", "offsetWidth", "offsetHeight", "oncopy", "oncut", "onpaste", "style", "onabort", "onblur", "onfocus", "onauxclick", "onbeforeinput", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragexit", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onformdata", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadend", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onwheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "onvolumechange", "onwaiting", "onselectstart", "ontoggle", "onpointercancel", "onpointerdown", "onpointerup", "onpointermove", "onpointerout", "onpointerover", "onpointerenter", "onpointerleave", "ongotpointercapture", "onlostpointercapture", "onmozfullscreenchange", "onmozfullscreenerror", "onanimationcancel", "onanimationend", "onanimationiteration", "onanimationstart", "ontransitioncancel", "ontransitionend", "ontransitionrun", "ontransitionstart", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "dataset", "tabIndex", "onerror", "getAttributeNames", "getAttribute", "getAttributeNS", "toggleAttribute", "setAttribute", "setAttributeNS", "removeAttribute", "removeAttributeNS", "hasAttribute", "hasAttributeNS", "hasAttributes", "closest", "matches", "webkitMatchesSelector", "getElementsByTagName", "getElementsByTagNameNS", "getElementsByClassName", "insertAdjacentElement", "insertAdjacentText", "mozMatchesSelector", "setPointerCapture", "releasePointerCapture", "hasPointerCapture", "setCapture", "releaseCapture", "getAttributeNode", "setAttributeNode", "removeAttributeNode", "getAttributeNodeNS", "setAttributeNodeNS", "getClientRects", "getBoundingClientRect", "scrollIntoView", "scroll", "scrollTo", "scrollBy", "insertAdjacentHTML", "querySelector", "querySelectorAll", "attachShadow", "requestFullscreen", "mozRequestFullScreen", "requestPointerLock", "animate", "getAnimations", "before", "after", "replaceWith", "remove", "prepend", "append", "replaceChildren", "namespaceURI", "prefix", "localName", "tagName", "id", "className", "classList", "part", "attributes", "scrollTop", "scrollLeft", "scrollWidth", "scrollHeight", "clientTop", "clientLeft", "clientWidth", "clientHeight", "scrollTopMax", "scrollLeftMax", "innerHTML", "outerHTML", "shadowRoot", "assignedSlot", "slot", "onfullscreenchange", "onfullscreenerror", "previousElementSibling", "nextElementSibling", "children", "firstElementChild", "lastElementChild", "childElementCount", "getRootNode", "hasChildNodes", "insertBefore", "appendChild", "replaceChild", "removeChild", "normalize", "cloneNode", "isSameNode", "isEqualNode", "compareDocumentPosition", "contains", "lookupPrefix", "lookupNamespaceURI", "isDefaultNamespace", "nodeType", "nodeName", "baseURI", "isConnected", "ownerDocument", "parentNode", "parentElement", "childNodes", "firstChild", "lastChild", "previousSibling", "nextSibling", "nodeValue", "textContent", "ELEMENT_NODE", "ATTRIBUTE_NODE", "TEXT_NODE", "CDATA_SECTION_NODE", "ENTITY_REFERENCE_NODE", "ENTITY_NODE", "PROCESSING_INSTRUCTION_NODE", "COMMENT_NODE", "DOCUMENT_NODE", "DOCUMENT_TYPE_NODE", "DOCUMENT_FRAGMENT_NODE", "NOTATION_NODE", "DOCUMENT_POSITION_DISCONNECTED", "DOCUMENT_POSITION_PRECEDING", "DOCUMENT_POSITION_FOLLOWING", "DOCUMENT_POSITION_CONTAINS", "DOCUMENT_POSITION_CONTAINED_BY", "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", "addEventListener", "removeEventListener", "dispatchEvent"];
        audioProps.forEach(prop => {
            if (typeof this.audio[prop] === 'function') {
                this[prop] = this.audio[prop].bind(this.audio);
            } else {
                Object.defineProperty(this, prop, {
                    get() {
                        return this.audio[prop];
                    },
                    set(newValue) {
                        this.audio[prop] = newValue;
                    }
                });
            }
        });
    }
}

customElements.define("audio-player", AudioPlayer);

export default AudioPlayer;