var svbt=document.getElementById('save');
var wlst=document.getElementById('whitelist');

wlst.oninput=function () {
wlst.style.height = 'inherit';
wlst.style.height = (wlst.scrollHeight+7)+"px";
}

function removeEls(d, array){
	var newArray = [];
	for (let i = 0; i < array.length; i++)
	{
		if (array[i] != d)
		{
			newArray.push(array[i]);
		}
	}
	return newArray;
}

function unDef(v,d,r){
	if(typeof r==='undefined'){
		return (typeof v !=='undefined')?v:d;
	}else{
		return (typeof v !=='undefined')?r:d;
	}
}

function checker(lstChk){
	let validate=true;
	
		lstChk = removeEls("", lstChk);

	for (let i = 0; i < lstChk.length; i++)
	{

		if (lstChk[i].split('/').length == 1)
		{
			console.log(lstChk[i] + ' is valid!');
		}
		else
		{

			if (lstChk[i].split('://')[0] == "")
			{
				console.warn(lstChk[i] + ' is invalid');
				validate = false;
			}

			if (lstChk[i].split('://')[lstChk[i].split('://').length + 1] == "")
			{
				console.warn(lstChk[i] + ' is invalid');
				validate = false;
			}

			if (lstChk[i].split('://').join('').split('/').length !== removeEls("", lstChk[i].split('://').join('').split('/')).length)
			{
				console.warn(lstChk[i] + ' is invalid');
				validate = false;
			}

		}

	}
	return validate;
}

var saver =function(){
    
	let w_lstChk = wlst.value.split(',');
	let validate_w = checker(w_lstChk);

	if (validate_w)
	{

			chrome.storage.sync.clear(function() {
				chrome.storage.sync.set(
				{
					wList: wlst.value
				}, function(){
					let status = document.getElementById('stats');
					status.innerText = 'Options saved.';
					setTimeout(function(){
						status.innerText = '';
					}, 1250);
				});
			});
		
	}else{
		alert('Whitelist textarea contents invalid!');
	}
}
 
function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
	chrome.storage.sync.get(null, function(items)
	{
		if (Object.keys(items).length != 0)
		{
			//console.log(items);
            wlst.value= unDef(items.wList,"");
            wlst.style.height = 'inherit';
			wlst.style.height = (wlst.scrollHeight+7)+"px";
			svbt.onclick = () => saver();
		}
		else
		{
			save_options();
		}
	});
	}
}

function save_options()
{
		chrome.storage.sync.clear(function() {
	chrome.storage.sync.set(
	{
		wList: ""
	}, function(){
		restore_options();
	});
		});
}

restore_options();