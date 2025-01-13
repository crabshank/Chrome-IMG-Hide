let whtlist=[];
let ctx=[];
let stylEl;
let hideStyl='img,video,iframe,[style*="background"][style*="url("]{border:2px red solid !important; margin-left:-0.5px !important; clip-path:polygon(0% 0%,0% 100%,0.3% 100%,0.3% 0.3%,99.7% 0.3%,99.7% 99.7%,0.3% 99.7%,0.3% 100%,100% 100%,100% 0%)!important;}';

function keepMatchesShadow(els,slcArr,isNodeName){
   if(slcArr[0]===false){
      return els;
   }else{
		let out=[];
		for(let i=0, len=els.length; i<len; i++){
		  let n=els[i];
				for(let k=0, len_k=slcArr.length; k<len_k; k++){
					let sk=slcArr[k];
					if(isNodeName){
						if((n.nodeName.toLocaleLowerCase())===sk){
							out.push(n);
						}
					}else{ //selector
						   if(!!n.matches && typeof n.matches!=='undefined' && n.matches(sk)){
							  out.push(n);
						   }
					}
				}
		}
		return out;
   	}
}

function getMatchingNodesShadow(docm, slc, isNodeName, onlyShadowRoots){
	let slcArr=[];
	if(typeof(slc)==='string'){
		slc=(isNodeName && slc!==false)?(slc.toLocaleLowerCase()):slc;
		slcArr=[slc];
	}else if(typeof(slc[0])!=='undefined'){
		for(let i=0, len=slc.length; i<len; i++){
			let s=slc[i];
			slcArr.push((isNodeName && slc!==false)?(s.toLocaleLowerCase()):s)
		}
	}else{
		slcArr=[slc];
	}
	var shrc=[docm];
	var shrc_l=1;
	var out=[];
	let srCnt=0;

	while(srCnt<shrc_l){
		let curr=shrc[srCnt];
		let sh=(!!curr.shadowRoot && typeof curr.shadowRoot !=='undefined')?true:false;
		let nk=keepMatchesShadow([curr],slcArr,isNodeName);
		let nk_l=nk.length;
		
		if( !onlyShadowRoots && nk_l>0){
			for(let i=0; i<nk_l; i++){
				out.push(nk[i]);
			}
		}
		
		for(let i=0, len=curr.childNodes.length; i<len; i++){
			shrc.push(curr.childNodes[i]);
		}
		
		if(sh){
			   let cs=curr.shadowRoot;
			   let csc=[...cs.childNodes];
			   if(onlyShadowRoots){
				  if(nk_l>0){
				   out.push({root:nk[0], childNodes:csc});
				  }
			   }
				for(let i=0, len=csc.length; i<len; i++){
					shrc.push(csc[i]);
				}
		}

		srCnt++;
		shrc_l=shrc.length;
	}
	
	return out;
}

function removeEls(d, arr) {
    return arr.filter((a)=>{return a!==d});
}

function findIndexTotalInsens(string, substring, index) {
    string = string.toLocaleLowerCase();
    substring = substring.toLocaleLowerCase();
    for (let i = 0; i < string.length ; i++) {
        if ((string.includes(substring, i)) && (!(string.includes(substring, i + 1)))) {
            index.push(i);
            break;
        }
    }
    return index;
}

function blacklistMatch(array, t) {
    var found = false;
	var blSite='';
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        ts = t.toLocaleLowerCase();
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
                        m = spl_mt.length - 2; //EARLY TERMINATE
                    } else if (!(spl_mt[m + 1][0] > spl_mt[m][0])) {
                        found = false;
                    }
                }

            }
            if(found){
				blSite = array[i];
				i = array.length - 1;
			}
        }
    }
    //console.log(found);
    return [found,blSite];

}

var isCurrentSiteBlacklisted = function()
{
		return blacklistMatch(whtlist, window.location.href);
};

function getStyle(el,prop){
    let c=el.style.cssText;
    let pat=new RegExp(`(?<=(^\\s*|;\\s*))${prop}\\s*\:\\s*([^;]*);?`);
    let cs=[...c];
    let p=c.match(pat);
    return p===null?'':p[2].split(/\s*\!important/)[0];
}

function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
		chrome.storage.sync.get(null, function(items){
			if (Object.keys(items).length != 0){
				//console.log(items);
				if(!!items.wList && typeof  items.wList!=='undefined'){
                    whtlist=items.wList.split('\n').join('').split(',');
                }
                isBl=isCurrentSiteBlacklisted();
                if(isBl[0]===false){
                    stylEl=document.createElement('style');
                    stylEl.innerHTML=hideStyl;
                    document.head.insertAdjacentElement('afterbegin',stylEl);
                    let vvis=(e)=>{
                        let p=e.composedPath();
                        let showCtx=true;
                        let ig=e.type==='contextmenu'?true:false;
                        let tgs=ig===false?['iframe','video','img','[style*="background"][style*="url("]']:['img','[style*="background"][style*="url("]'];
                        for(let i=0, len=p.length;i<len;++i){
                            let pi=p[i];
                            let vd=getMatchingNodesShadow(pi,tgs, false, false);
                            let vdl=vd.length;
                            if(vdl>0){
                                let stEmpty=false;
                                for(let j=0;j<vdl;++j){
                                    let vdj=vd[j];
                                    if(ig===false || !ctx.includes(vdj)){
                                        if(ig===true){
                                            showCtx=false;
                                            ctx.unshift(vdj);
                                        }
                                        if(stEmpty===false){
                                            stylEl.innerHTML='';
                                            stEmpty=true;
                                        }
                                        let w=window.getComputedStyle(vdj);
                                        let c=[
                                            'border',
                                            'margin-left',
                                            'clip-path'
                                        ];
                                    
                                        c.forEach((p)=>{
                                            let s=getStyle(vdj,p);
                                            s=s!==''?s:w[p];
                                            vdj.style.setProperty(p,s,'important');
                                        });
                                    }
                                }
                                if(stEmpty===true){
                                    stylEl.innerHTML=hideStyl;
                                }
                                break;
                            }
                        }
                        if(showCtx===false){
                            return false;
                        }
                    };
                    window.addEventListener('click',vvis,{capture: true, passive:false});
                    window.addEventListener('click',vvis,{capture: false, passive:false});
                    window.oncontextmenu=vvis;
                }
            }else{
                save_options();
            }""
	});
	}
}

function save_options()
{
		chrome.storage.sync.clear(function() {
	chrome.storage.sync.set(
	{
		wList: ""
	}, function()
	{
		console.log('Default options saved.');
		restore_options();
	});
		});

}

restore_options();