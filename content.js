let exclusionList = []; // Renamed from whtlist for logical clarity
let unhiddenTargets = [];
let stylEl;
// Note: The [style*="background"] selector ONLY catches inline styles. 
// It cannot detect background images applied via CSS classes or external stylesheets.
let hideStyl = 'img,video,iframe,[style*="background"][style*="url("]{border:2px red solid !important; margin-left:-0.5px !important; clip-path:polygon(0% 0%,0% 100%,0.3% 100%,0.3% 0.3%,99.7% 0.3%,99.7% 99.7%,0.3% 99.7%,0.3% 100%,100% 100%,100% 0%)!important;}';

function getParent(el, elementsOnly, doc_head_body) {
    if (!!el && typeof el !== 'undefined') {
        let out = null;
        let curr = el;
        let end = false;
        
        while (!end) {
            if (!!curr.parentNode && typeof curr.parentNode !== 'undefined') {
                out = curr.parentNode;
                curr = out;
                end = (elementsOnly && out.nodeType != 1) ? false : true;
            } else if (!!curr.parentElement && typeof curr.parentElement !== 'undefined') {
                out = curr.parentElement;
                end = true;
                curr = out;
            } else if (!!curr.host && typeof curr.host !== 'undefined') {
                out = curr.host;
                end = (elementsOnly && out.nodeType != 1) ? false : true;
                curr = out;
            } else {
                out = null;
                end = true;
            }
        }
        
        if (out !== null) {
            if (!doc_head_body) {
                if (out.nodeName === 'BODY' || out.nodeName === 'HEAD' || out.nodeName === 'HTML') {
                    out = null;
                }
            }
        }
        return out;
    } else {
        return null;
    }
}

function getAncestors(el, elementsOnly, elToHTML, doc_head_body, notInShadow) {
    let curr = el;
    let ancestors = [el];
    let outAncestors = [];
    let end = false;
    
    while (!end) {
        let p = getParent(curr, elementsOnly, doc_head_body);
        if (p !== null) {
            if (elToHTML) { ancestors.push(p); } else { ancestors.unshift(p); }
            curr = p;
        } else { end = true; }
    }
    
    if (notInShadow) {
        if (elToHTML) {
            for (let i = ancestors.length - 1; i >= 0; i--) {
                outAncestors.unshift(ancestors[i]);
                if (!!ancestors[i].shadowRoot && typeof ancestors[i].shadowRoot !== 'undefined') { i = 0; }
            }
        } else {
            for (let i = 0, len = ancestors.length; i < len; i++) {
                outAncestors.push(ancestors[i]);
                if (!!ancestors[i].shadowRoot && typeof ancestors[i].shadowRoot !== 'undefined') { i = len - 1; }
            }
        }
    } else {
        outAncestors = ancestors;
    }
    return outAncestors;
}

function keepMatchesShadow(els, slcArr, isNodeName) {
    if (slcArr[0] === false) { return els; } 
    else {
        let out = [];
        for (let i = 0, len = els.length; i < len; i++) {
            let n = els[i];
            for (let k = 0, len_k = slcArr.length; k < len_k; k++) {
                let sk = slcArr[k];
                if (isNodeName) {
                    if ((n.nodeName.toLocaleLowerCase()) === sk) { out.push(n); }
                } else {
                    if (!!n.matches && typeof n.matches !== 'undefined' && n.matches(sk)) { out.push(n); }
                }
            }
        }
        return out;
    }
}

function getMatchingNodesShadow(docm, slc, isNodeName, onlyShadowRoots) {
    let slcArr = [];
    if (typeof(slc) === 'string') {
        slc = (isNodeName && slc !== false) ? (slc.toLocaleLowerCase()) : slc;
        slcArr = [slc];
    } else if (typeof(slc[0]) !== 'undefined') {
        for (let i = 0, len = slc.length; i < len; i++) {
            let s = slc[i];
            slcArr.push((isNodeName && slc !== false) ? (s.toLocaleLowerCase()) : s);
        }
    } else { slcArr = [slc]; }
    
    var shrc = [docm];
    var shrc_l = 1;
    var out = [];
    let srCnt = 0;

    while (srCnt < shrc_l) {
        let curr = shrc[srCnt];
        let sh = (!!curr.shadowRoot && typeof curr.shadowRoot !== 'undefined') ? true : false;
        let nk = keepMatchesShadow([curr], slcArr, isNodeName);
        let nk_l = nk.length;
        
        if (!onlyShadowRoots && nk_l > 0) {
            for (let i = 0; i < nk_l; i++) { out.push(nk[i]); }
        }
        
        for (let i = 0, len = curr.childNodes.length; i < len; i++) { shrc.push(curr.childNodes[i]); }
        
        if (sh) {
            let cs = curr.shadowRoot;
            let csc = [...cs.childNodes];
            if (onlyShadowRoots) {
                if (nk_l > 0) { out.push({root: nk[0], childNodes: csc}); }
            }
            for (let i = 0, len = csc.length; i < len; i++) { shrc.push(csc[i]); }
        }
        srCnt++;
        shrc_l = shrc.length;
    }
    return out;
}

function removeEls(d, arr) { return arr.filter((a) => { return a !== d; }); }

function findIndexTotalInsens(string, substring, index) {
    string = string.toLocaleLowerCase();
    substring = substring.toLocaleLowerCase();
    for (let i = 0; i < string.length; i++) {
        if ((string.includes(substring, i)) && (!(string.includes(substring, i + 1)))) {
            index.push(i);
            break;
        }
    }
    return index;
}

function exclusionMatch(array, t) { // Renamed from blacklistMatch
    var found = false;
    var blSite = '';
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        let ts = t.toLocaleLowerCase();
        for (var i = 0; i < array.length; i++) {
            let spl = array[i].split('*');
            spl = removeEls("", spl);
            var spl_mt = [];
            for (let k = 0; k < spl.length; k++) {
                var spl_m = [];
                findIndexTotalInsens(ts, spl[k], spl_m);
                spl_mt.push(spl_m);
            }
            found = true;
            if ((spl_mt.length == 1) && (typeof spl_mt[0][0] === "undefined")) {
                found = false;
            } else if (!((spl_mt.length == 1) && (typeof spl_mt[0][0] !== "undefined"))) {
                for (let m = 0; m < spl_mt.length - 1; m++) {
                    if ((typeof spl_mt[m][0] === "undefined") || (typeof spl_mt[m + 1][0] === "undefined")) {
                        found = false;
                        m = spl_mt.length - 2; 
                    } else if (!(spl_mt[m + 1][0] > spl_mt[m][0])) {
                        found = false;
                    }
                }
            }
            if (found) { blSite = array[i]; i = array.length - 1; }
        }
    }
    return [found, blSite];
}

var isCurrentSiteExcluded = function() { // Renamed for clarity
    return exclusionMatch(exclusionList, window.location.href);
};

function getStyle(el, prop) {
    let c = el.style.cssText;
    let pat = new RegExp(`(?<=(^\\s*|;\\s*))${prop}\\s*\\:\\s*([^;]*);?`);
    let p = c.match(pat);
    return p === null ? '' : p[2].split(/\s*\!important/)[0];
}

function getLCA(nodes) {
    if (!nodes || nodes.length === 0) return document.documentElement;
    if (nodes.length === 1) return nodes[0];
    
    // Get ancestor chains for all nodes (ordered from node -> html)
    let chains = nodes.map(n => getAncestors(n, true, true, true, false));
    let firstChain = chains[0];
    
    // Iterate from the node upwards; the first node present in ALL chains is the LCA
    for (let i = 0, len_i=firstChain.length; i<len_i; ++i) {
        let candidate = firstChain[i];
        let isCommon = true;
        for (let j = 0, len_j=chains.length; j<len_j; ++j) {
            if (!chains[j].includes(candidate)) {
                isCommon = false;
                break;
            }
        }
        if (isCommon) return candidate;
    }
    return document.documentElement; // Fallback
}

function restore_options() {
    if (typeof chrome.storage === 'undefined') {
        restore_options();
    } else {
        chrome.storage.sync.get(null, function(items) {
            if (Object.keys(items).length != 0) {
                if (!!items.wList && typeof items.wList !== 'undefined') {
                    exclusionList = items.wList.split('\n').join('').split(',');
                }
                let isExcluded = isCurrentSiteExcluded();
                
                // If the site is NOT in the exclusion list, hide the images
                if (isExcluded[0] === false) {
                    stylEl = document.createElement('style');
                    stylEl.innerHTML = hideStyl;
                    document.head.insertAdjacentElement('afterbegin', stylEl);
                    
                    let vvis=(e)=>{
                        let p=getAncestors(e.target, true, true, true, false);
                        let showCtx=true; //false=> no contextmenu
                        let isCtx=e.type==='contextmenu'?true:false;
                        let tgs=isCtx===false?['iframe','video','img','[style*="background"][style*="url("]']:['img','[style*="background"][style*="url("]'];
                        
                        let initialTargets = [];
                            for(let i=0, len=p.length;i<len;++i){
                                let pi=p[i];
                                let vd=getMatchingNodesShadow(pi,tgs, false, false);
                                if(vd.length>0){
                                    initialTargets = vd;
                                    break;
                                }
                                
                            }
                        if(initialTargets.length > 0){
                            initialTargets.forEach(t => {
                                if(!unhiddenTargets.includes(t)){ //if has red rect
                                    unhiddenTargets.push(t);
                                    showCtx=false; //deny context menu
                                }
                            });
                            let lca = getLCA(unhiddenTargets);

                            // 4. Find ALL matching media elements that are descendants of the LCA
                            let allDescendants = getMatchingNodesShadow(lca, tgs, false, false);
                            stylEl.innerHTML='';
                            for (let j = 0, len_j=allDescendants.length; j<len_j; ++j) {
                                let vdj=allDescendants[j];
                                if(!unhiddenTargets.includes(vdj)){
                                    unhiddenTargets.push(vdj);
                                }
                                let w=window.getComputedStyle(vdj);
                                        let c=[
                                            'border',
                                            'margin-left',
                                            'clip-path'
                                        ];
                                    
                                        c.forEach((n)=>{
                                            let s=getStyle(vdj,n);
                                            s=s!==''?s:w[n];
                                            vdj.style.setProperty(n,s,'important');
                                        });
                            }
                            stylEl.innerHTML=hideStyl;
                        }
                            return showCtx;
                    };
                    
                    window.addEventListener('click', vvis, {capture: true, passive: false});
                    window.addEventListener('click', vvis, {capture: false, passive: false});
                    window.oncontextmenu = vvis;
                }
            } else {
                save_options();
            } // Removed syntax error ""
        });
    }
}

function save_options() {
    chrome.storage.sync.clear(function() {
        chrome.storage.sync.set({ wList: "" }, function() {
            console.log('Default options saved.');
            restore_options();
        });
    });
}

restore_options();