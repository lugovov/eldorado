// ==UserScript==
// @name         Eldorado Market
// @namespace    http://eldorado.botva.ru/
// @version      0.1.4
// @downloadURL  https://github.com/lugovov/eldorado/raw/master/market.user.js
// @updateURL    https://github.com/lugovov/eldorado/raw/master/market.meta.js
// @description  try to take over the world!
// @author       lugovov
// @match        https://eldorado.botva.ru/
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-start
// ==/UserScript==

window.addEventListener ("load", function() {
    'use strict';
    var win=window.unsafeWindow;
    win.jQuery(document).ajaxComplete( function( event, xhr, options ){
        if(options.url=='https://eldorado.botva.ru/fx.php'){
            try{
                if(xhr.responseJSON.result.island_data){
                    updateNames(xhr.responseJSON.result.island_data,xhr.responseJSON.result.continent_index,xhr.responseJSON.result.island_index);
                }
            }catch(e){console.error(e)}
            try{
                if(xhr.responseJSON.server.rating_list){
                    updateTop(xhr.responseJSON.server.rating_list);
                }
            }catch(e){console.error(e)}
            try{
                displayLots(xhr.responseJSON.info._castle_data[9].data.orders);
            }catch(e){console.error(e)}
        }
    });
var storage=new function(){
    var data={},db;
    var updateStorage=function(){
        clearTimeout(timer);
        timer=setTimeout(()=>{
            GM_setValue('pid_names', encodeURI(JSON.stringify(data)));
        },1000)
    }
    try{
        db=decodeURI(GM_getValue('pid_names'));
        if(!db){
            db=win.localStorage.getItem('pid_names');
            if(db){
                updateStorage();
                setTimeout(()=>win.localStorage.removeItem('pid_names'),10000);
            }
        }
        db=JSON.parse(db);
        if(db){
            data=db;
        }
    }catch(e){}
    var timer=false;

    this.get=function(id){
        if(id in data){
            return String(data[id].name).replace(/</g,'&lt;')
        }
        return '';
    }
    this.set=function(id,info){
        if(!(id in data) || data[id].name!=info.name){
            data[id]=info;
            updateStorage()
        }
    }
    return this;
}
    var div;
    document.body.addEventListener('keypress', function(event){
		switch(event.code){
			case 'KeyH':{
				if(div){
					div.style.display=div.style.display=='none'?'':'none';
				}
				break;
			}
		}
	})    
    var initDiv=function(){
        var style=document.createElement('style');
        var root=document.createElement('div');
        var shadow=root.attachShadow({mode:'open'});
        style.textContent=`#market{
pointer-events:none;
border:1px solid #f8dd7b;
background-color:#fbebaa;
transition:0.5s;
position:fixed;
top:0;
right:0;
padding: 10px;
border-radius: 0 0 0 10px;
z-index:10;
opacity: 0.8;
font-size: 1vw;
}
.blink{color:red;font-size:150%}
`
        shadow.appendChild(style);
        div=document.createElement('div');
        div.id="market"
        shadow.appendChild(div);
        document.body.appendChild(root);

    }
    var displayLots=function(lots){
        if(!div){
            initDiv();
        }
        var text=['<table style="width:100%;border-color: #e49f63;" cellspacing="0" border="1" cellpadding="3">'];
        for(let i in lots){
            text.push('<tr><td colspan="3"><br/><b>'+win.getLang('name_res'+i)+'</b></td></tr><tr><th>Кол</th><th>Цена</th><th>Игрок</th></tr><tr>'+
                      lots[i].map((lot,index)=>'<td align="right">'
                                  +win.digits(lot.amount)+'</td><td align="right"><span'
                                  +(lots[i][index+1]&&(lots[i][index+1].price>lot.price*1.5)?' class="blink"':'')+'>'+
                                     win.digits(lot.price)+'</span></td><td>'+storage.get(lot.pid)+'</td>')
                      .join('</tr><tr>')
                  +'</tr>');
        }
        text.push('</table>');
        div.innerHTML=text.join('');
    }
    var updateNames=function(data,cont,isl){
        [22,25,28,31,34,37].forEach(i=>{
            if(data[i].pid>''){
                storage.set(data[i].pid,{cont:cont,island:isl,name:data[i].name,lvl:data[i].level})
            }
        })
    }
    var updateTop=function(data){
        for(var i in data){
                storage.set(data[i].id,{cont:data[i].continent,island:data[i].island,name:data[i].name,lvl:data[i].level})
        }
    }
});
