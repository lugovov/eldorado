// ==UserScript==
// @name         Улучшения Эльдорадо
// @namespace    http://eldorado.botva.ru/
// @version      0.5.2
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
                displayEvent(xhr.responseJSON.info._event);
            }catch(e){console.error(e)}
            try{
                createMoneyTimer(xhr.responseJSON.info);
            }catch(e){console.error(e)}
            try{
                var params=new URLSearchParams(options.data);
                switch(params.get('cmd')){
                    case 'do_craft':{
                        island_timers.setTimer(params.get('island_point'),xhr.responseJSON.result.island_data[params.get('island_point')].type,xhr.responseJSON.result.island_data[params.get('island_point')].back_time+'000');
                        break;
                    }
                    case 'do_leave':{
                        island_timers.removeTimer(params.get('island_point'));
                        break;
                    }
                }
            }catch(e){}
            try{
                island_timers.updateTimer(xhr.responseJSON.info.effects)
            }catch(e){}
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
    var island_timers=new function(){
        var timers={},div,display;
        var time=function(sec){
            return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
        }
        this.removeTimer=function(id){
            if(id in timers){
                delete timers[id];
                this.saveTimers();
                this.updateTimers();
            }
        }
        this.setTimer=function(id,type,end){
            timers[id]={
                icon:win.getLang('icon_res'+type),
                name: win.getLang('name_res'+type),
                harvest: new Date().valueOf(),
                end: Number(end),
                din: true
            };
            this.saveTimers();
            this.updateTimers();
        }
        this.updateTimer=function(effects){
            var active=[];
            for(let i in effects){
                if(effects[i].type=='1090'){
                    if(timers[effects[i].var1]){
                        timers[effects[i].var1].harvest=effects[i].time_from+'000';
                    }
                    active.push(effects[i].var1);
                }
            }
            for(let i in timers){
                if(active.indexOf(i)==-1){
                    this.removeTimer(i);
                }
            }
        }
        this.updateTimers=function(){
            let now=Date.now();
            for(var i in timers){
                if(timers[i].end<now){
                    delete timers[i];
                }
            }
        }
        setInterval(()=>{
            var text=[];
            var now=Date.now();
            for(let i in timers){
                let sec=(now-timers[i].harvest)/1000;
                let res=Math.min(5,Math.floor(sec/600));
                if(now>timers[i].end){
                    setTimeout(this.updateTimers(),100);
                    continue;
                }
                let harv=(timers[i].end<now+600000||res==5);
                text.push('<div'+(harv&&res>0?' class="harvest"':'')+'>'+timers[i].name+': '+String(timers[i].icon).repeat(res)+
                          (res<5 &&(((timers[i].end-now)>sec%600)&&(600-Math.floor(sec%600)<(timers[i].end-now)/1000)
                )?' через '+time(600-Math.floor(sec%600)):'')+
                          (harv&&res>0?' СОБИРАТЬ! ':'')+
                          (timers[i].end<now+3600000?', до возврата '+time(Math.floor((timers[i].end-now)/1000)):'')+
                          '</div>'
                         );
            }
            if(text.length==0){
                /*
                let units=[],
                    info=win.ng_data.info
                if(info.unit_1>0){
                    units.push()
                }
                */
                text.push('А не захватить ли нам оазис?');
            }
            div.innerHTML=text.join('');
        },1000)
        this.saveTimers=function(){
            localStorage.setItem('timers',JSON.stringify(timers));
        }
        this.loadTimers=function(){
            try{
                var t=JSON.parse(localStorage.getItem('timers'))
                if(t){
                    timers=t;
                    this.updateTimers();
                }
            }catch(e){}
        }
        var style=document.createElement('style');
        var root=document.createElement('div');
        var shadow=root.attachShadow({mode:'open'});
        style.textContent=`#timers{
pointer-events:none;
border:1px solid #f8dd7b;
background-color:#fbebaa;
transition:0.5s;
position:fixed;
left:0;
bottom:0;
padding: 10px;
border-radius: 0 10px 0 0;
z-index:10;
opacity: 0.8;
font-size: 1vw;
line-height:1.5vw;
}
#timers .harvest{color:red;font-size:250%}
.icon {
    width: 20px;
    height: 20px;
    display: inline-block;
    background-image: url(/static/images/ico_20.png?v=6);
    background-repeat: no-repeat;
    vertical-align: middle;
    background-color: transparent;
}
.icon_res1 {
    background-position: -80px -40px;
}

.icon_res2 {
    background-position: -100px -40px;
}

.icon_res3 {
    background-position: -140px -40px;
}

.icon_res4 {
    background-position: -120px -40px;
}
`
        shadow.appendChild(style);
            div=document.createElement('div');
            div.id="timers"
            shadow.appendChild(div);
            document.body.appendChild(root);
        this.loadTimers();
        return this;
    }

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
                    value:Number(data.gold),
                    time: Date.now(),
                    max: Number(data._castle_stat.cap_gold),
                    inHour:Number(data._castle_stat.mine_gold),
                    id:1,
                },
                gems:{
                    value:Number(data.gems),
                    time: Date.now(),
                    max:Number(data._castle_stat.cap_gems),
                    inHour:Number(data._castle_stat.mine_gems),
                    id:2
                }
            };
            autoUpdate('money');
            autoUpdate('gems');
        }
    })();
    var displayEvent=(function(){
        var div;
        var style=document.createElement('style');
        var root=document.createElement('div');
        var shadow=root.attachShadow({mode:'open'});
        style.textContent=`#event{
pointer-events:none;
/*
border:1px solid #f8dd7b;
background-color:#fbebaa;
*/
transition:0.5s;
position:fixed;
right:0;
bottom:0;
padding: 10px;
border-radius: 0 10px 0 0;
z-index:10;
opacity: 0.8;
font-size: 14pt;
/*line-height:1.5vw;*/
}
.eb{
margin: 0 auto;
    width: 246px;
    height: 246px;
    line-height: 120%;
    box-sizing: border-box;
}
.timer {
    width: 110px;
    height: 30px;
padding-top:10px;
    background: url(/static/images/events/event_ribbon.png);
    left: 0;
    right: 0;
    margin: 0 auto;
    bottom: 50px;
position:absolute;
text-align:center;
}
`
        shadow.appendChild(style);
            div=document.createElement('div');
            div.id="event"
            shadow.appendChild(div);
            document.body.appendChild(root);
        var timer;
        var clearTimer=function(){
            clearInterval(timer);
        }
        var setTimer=function(el,end){
            let endtime=Number(end+'000');
            timer=setInterval(()=>{
                let time=endtime-Date.now();
                if(time<0){
                    el.textContent='--:--:--';
                    clearTimer();
                }else{
                    let s=Math.floor(time/1000);
                    let m=Math.floor(s/60);
                    let h=Math.floor(m/60);
                    el.textContent=[h,m%60,s%60].map(v=>String(v).padStart(2,'0')).join(':');
                }
            })
        }
        return function(event){
            clearTimer();
            console.log(event);
            if(event && event.done=="0"){
                div.innerHTML='<div class="eb"><div class="timer"></div></div>'
                div.querySelector('.eb').style.backgroundImage='url(/static/images/events/npc'+String(event.type).padStart(2,'0')+'_'+String(event.complexity).padStart(2,0)+'.png)';
                setTimer(div.querySelector('.timer'),event.time);
            }
            else{
                div.innerHTML='';
            }
        }
    })()
});
