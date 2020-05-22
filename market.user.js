// ==UserScript==
// @name         Рынок Эльдорадо и БМ островов
// @namespace    http://eldorado.botva.ru/
// @version      0.3.1
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
            try{
                createMoneyTimer(xhr.responseJSON.info);
            }catch(e){console.error(e)}            
            setTimeout(()=>{
                try{
                    displayIsland(xhr.responseJSON.result.island_data);
                }catch(e){console.error(e)}
                try{
                    if(xhr.responseJSON.result.continent_data){
                        updateContinent(xhr.responseJSON.result.continent_data,xhr.responseJSON.result.continent_index);
                    }
                }catch(e){console.error(e)}
            },1000)

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
    this.continent=function(id){
        let stat={};
        for(let i in data){
            if(data[i].cont==id){
                if(!(data[i].island in stat)){
                    stat[data[i].island]=0;
                }
                stat[data[i].island]++;
            }
        }
        return stat;
    }
    return this;
}
    var div,show=true;;
    document.body.addEventListener('keypress', function(event){
		switch(event.code){
			case 'KeyH':{
				show=!show;
				if(div){
					div.style.display=show?'':'none';
				}
                if(!show){
                    hideIsland();
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
    var displayIsland=function(data){
        if(show){
            for(let i in data){
                if(data[i].can_attack==1){
                    let el=document.querySelector('.town_block[data-index="'+i+'"]').querySelector('.map_item_number')
                    if(!el){
                        continue;
                    }
                    el.textContent=data[i].local_army.army_power;
                    el.style.opacity=1;
                }
            }
        }
    }
    var hideIsland=function(){
        document.querySelectorAll('.map_item_number').forEach(el=>{
            el.textContent=el.parentNode.parentNode.dataset.index;
            el.style.opacity=null;
        })
    }
    var updateContinent=function(data,id){
        if(show){
            let stat=storage.continent(id);
            document.querySelectorAll('.island_block').forEach(el=>{
                let index=el.dataset.index;
                let flag=el.querySelector('.island_block_flag');
                if(flag && stat[index]!=flag.textContent && flag.textContent>0 ){
                    el.style.filter='grayscale(0.9)';
                    flag.classList.remove('flag1','flag2','flag3');
                }
            })
        }
    }
    var createMoneyTimer=(function(){
        var timers={}
        var info={};
        var autoUpdate=function(type){
            clearInterval(timers[type]);
            var speed=3600000/info[type].inHour;
            timers[type]=setInterval(()=>{
                if(show){
                    let value=info[type].value+Math.floor((Date.now()-info[type].time)/speed);
                    if(value>=info[type].max){
                        clearInterval(timers[type])
                        value=info[type].max
                    }
                    let el=document.querySelector('.global_header_money_item[data-id="'+info[type].id+'"] .global_header_money_text b')
                    if(el)el.textContent=win.digits(value);
                }
            },Math.max(100,Math.ceil(speed)));
        }
        return function(data){
            info={
                money:{
                    value:data.gold,
                    time: Date.now(),
                    max:data._castle_stat.cap_gold,
                    inHour:data._castle_stat.mine_gold,
                    id:1,
                },
                gems:{
                    value:data.gems,
                    time: Date.now(),
                    max:data._castle_stat.cap_gems,
                    inHour:data._castle_stat.mine_gems,
                    id:2
                }
            };
            autoUpdate('money');
            autoUpdate('gems');
        }
    })();    
});
