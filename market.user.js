// ==UserScript==
// @name         Улучшения Эльдорадо
// @namespace    http://eldorado.botva.ru/
// @version      0.9.2.1
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
    var watch=function(target,config,cb){
        const observer = new MutationObserver(cb);
        observer.observe(target, config);
    }


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
                displayEvent(xhr.responseJSON.info._event);
            }catch(e){console.error(e)}
            try{
                createMoneyTimer(xhr.responseJSON.info);
            }catch(e){console.error(e)}
            try{
                var params=new URLSearchParams(options.data);
                switch(params.get('cmd')){
                    case 'event_start':{
                        if(xhr.responseJSON.result.event_boxes){
                            events.select(xhr.responseJSON.result.event_boxes,params.get('casket'));
                        }
                        break;
                    }
                    case 'do_attack':{
                        if(xhr.responseJSON.result.report){
                            fight.result(xhr.responseJSON.result.report);
                        }
                        break;
                    }
                }
            }catch(e){}
            try{
                island_timers.setTimer(xhr.responseJSON.info._hero_list);
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
        this.setTimer=function(list){
            timers=list;
            this.saveTimers();
            this.updateTimers();
        }
        this.updateTimer=function(effects){
        }
        this.updateTimers=function(){
        }
        setInterval(()=>{
            var text=['<table>'];
            var now=Date.now();
            var active=0;
            if(win.ng_data.info._hero_active){
                active=win.ng_data.info._hero_active.id
            }
            for(let i in timers){
                let hero=timers[i];
                let units=[];
                for(let u=1;u<4;u++){
                    if(hero['unit_'+u]>0){
                        units.push('<b class="icon icon_unit'+u+'"></b>'+hero['unit_'+u]);
                    }
                }
                if(units.length==0){
                    continue;
                }
                let res=[];
                for(let r=1;r<5;r++){
                    if(hero['res_'+r]>0){
                        res.push('<b class="icon icon_res'+r+'"></b>'+hero['res_'+r]);
                    }
                }
                if(!hero.hasOwnProperty('base_energy')){
                    hero.base_energy=Number(hero.energy);
                }
                let energy=Math.min(hero.base_energy+Math.floor((now-new Date(Number(hero.energy_time)*1000))/50000),hero.max_energy);
                if(hero.enegry!=energy){
                    hero.energy=energy;
                }
                text.push(`<tr `+(active==i?' style="font-weight:bolder"':'')
                          +`><td><b class="icon icon_level"></b>${hero.lvl}</td><td>`
                          +win.getLang('name_card'+timers[i].type)+`</td><td>`+units.join(' ')+`</td><td><b class="icon icon_exp"></b> ${hero.exp}/${hero.max_exp}</td><td>`
                          +res.join(' ')+`</td><td><b class="icon icon_energy"></b>: ${energy}/${hero.max_energy}</td></tr>`);
            }
            text.push('</table>');
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
        this.showHide=(show)=>{
            div.style.display=show?'':'none';
        }
        var style=document.createElement('style');
        var root=document.createElement('div');
        var shadow=root.attachShadow({mode:'open'});
        style.textContent=`#timers{
pointer-events:none;
border:4px solid #0082cd;
background-color:#fbebaa;
transition:0.5s;
position:fixed;
right:0;
bottom:0;
padding: 10px;
border-radius: 10px 0 0 0;
z-index:10;
opacity: 0.8;
font-size: 1vw;
line-height:1.5vw;
text-align:right;
    border-width: 5px 0 0 5px;
}
.icon {
    width: 20px;
    height: 20px;
    display: inline-block;
    background-image: url(/static/images/ico_20.png?v=11);
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
.icon_energy {
background-position: -80px -140px;
}
.icon_exp {
    background-position: -60px -40px;
}
.icon_level {
    background-position: 0 -40px;
}
.icon_unit1 {
    background-position: -60px -120px;
}

.icon_unit2 {
    background-position: -40px -120px;
}

.icon_unit3 {
    background-position: -20px -120px;
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

var events=new function(){
    var _data={
    balance:{gold:0,gems:0},
    ushan:{
        1:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        },
        2:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        },
        3:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        }
    },
    gena:{
        1:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        },
        2:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        },
        3:{
            select:{l:0,m:0,b:0},
            l:[0,0,0],
            m:[0,0,0],
            b:[0,0,0]
        }
    }
};
try{
    let data=JSON.parse(decodeURI(GM_getValue('events')));
    if(data){
        _data=data;
    }
}catch(e){
}
    var save=function(){
        GM_setValue('events',encodeURI(JSON.stringify(_data)));
    }
    var getType=function(){
        var type=Number(win.ng_data.info._event.type);
        switch(type){
            case 4:return "ushan";break;
            case 3:return "gena";break;
		}
		return false;
    }
    this.select=function(boxes,select){
        var type=getType();
        for(let i in win.ng_data.info._event.price){
            switch(Number(win.ng_data.info._event.price[i].what)){
                case 1:_data.balance.gold-=win.ng_data.info._event.price[i].amount;break;
                case 2:_data.balance.gems-=win.ng_data.info._event.price[i].amount;break;
            }
        }
        switch (Number(boxes[select].what)){
                case 1:_data.balance.gold+=boxes[select].amount;break;
                case 2:_data.balance.gems+=boxes[select].amount;break;
        }
        var curr=_data[type][win.ng_data.info._event.complexity];
        var ma=Math.max(boxes[1].amount,boxes[2].amount,boxes[3].amount),
            mi=Math.min(boxes[1].amount,boxes[2].amount,boxes[3].amount),
            mai=boxes[1].amount==ma?1:(boxes[2].amount==ma?2:3),
            mii=boxes[1].amount==mi?1:(boxes[2].amount==mi?2:3);
        curr.select[select==mii?'l':(select==mai?'b':'m')]++;
        curr.l[mii==1?0:(mii==2?1:2)]++;
        curr.b[mai==1?0:(mai==2?1:2)]++;
        curr.m[mii!=1&&mai!=1?0:(mii!=2&&mai!=2?1:2)]++;
        save();
    }
    
    this.updateWindow=(el)=>{
        let type=getType();
        if(type===false)return;
        var curr=_data[type][win.ng_data.info._event.complexity];
        let div=el.querySelector('.content .g_title+.g_body');
        let table=document.createElement('table');
        table.style=`margin-right: auto;width: 450px;`;
        let size={l:'мало',m:'Средне',b:'МНОГО'}
        let sum=[];
        for(let i=0;i<3;i++){
            sum.push(curr.b[i]+curr.m[i]+curr.l[i]);
        }
        for(let s in size){
            let tr=table.insertRow();
            let td;
            td=tr.insertCell();
            td.textContent=size[s];
            for(let i=0;i<3;i++){
                td=tr.insertCell();
                td.textContent=curr[s][i]+(sum[i]>0?' ('+Math.round(curr[s][i]/sum[i]*100)+'%)':'');
             }
        }
        div.appendChild(table)
    }    
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
        if(!(id in data) || JSON.stringify(data[id])!=JSON.stringify(info)){
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


// fight_stat

var fight=new function(){

    var _data={
    };
try{
    let data=JSON.parse(decodeURI(GM_getValue('fight_stat')));
    if(data){
        _data=data;
        console.log('fight_stat',data);
    }
}catch(e){
}
    var save=function(){
        GM_setValue('fight_stat',encodeURI(JSON.stringify(_data)));
        console.log('fight_stat',_data);
    }
    var updateResult=function(bm,army,death){
        army=Number(army);
        var update=false;
        if(!_data.hasOwnProperty(bm)){
            _data[bm]={}
        }
        if(!_data[bm].hasOwnProperty(death)){
            _data[bm][death]={min:army,max:army}
            update=true;
        }
        if(army<_data[bm][death].min){
            _data[bm][death].min=army;
            update=true;
        }else
        if(army>_data[bm][death].max){
            _data[bm][death].max=army;
            update=true;
        }
        if(update){
            save();
            let log=[];
            for(let i in _data[bm]){
                log.push({death:i,min:_data[bm][i].min,max:_data[bm][i].max})
            }
            console.table(log);
        }
    }
    this.result=function(report){
        var bm=0,
            units=win.ng_data.config_units;
        if(report.units[1]>0 || report.units[2]>0){
           // console.log('Нападение не только пчёлками. пропускаем..');
            return false;
        }
        for(let i in report.enemy_units){
            bm+=report.enemy_units[i]*units[report.enemy_unit_types[i]][0]*units[report.enemy_unit_types[i]][1];
        }
        updateResult(bm,report.units[3],report.units_killed[3]);

        //save();
    }
    var unitsmy=[6,8,16];
    var units=[1,6,8,25,350];
    var calcDeath=function(t,a,r,c){let e=t/Math.sqrt(a);return r.map((r,h)=>Math.ceil(e*(r*c[h]/a)*Math.sqrt(t/c[h]/c[h])))};
    this.updateAttackWindow=function(point){
        var tables=document.querySelectorAll('#action table.ta_c');
        if(tables.length!=2) return;
        let local_army=win.ng_data.island_data[point].local_army;
        let bme=local_army.army_power;
        let result={my:[0,0,0],enemy:[0,0,0,0,0]};
        let my=[Number(win.ng_data.info._hero_active.unit_1),
                Number(win.ng_data.info._hero_active.unit_2),
                Number(win.ng_data.info._hero_active.unit_3)
               ],
            enemy=[0,0,0,0,0];
        let bm=0;
        my.forEach((inp,ind)=>{
            bm+=inp*unitsmy[ind];
        });
        for(let i in local_army.units){
            enemy[local_army.units[i].type-4]=local_army.units[i].amount
        }
        if(bm>0){
            if(bm>bme){
                result.my=calcDeath(bme,bm,my,unitsmy);
                result.enemy=enemy
            }else{
                result.enemy=calcDeath(bm,bme,enemy,units);
                result.my=my;
            }
        }
                          ;
        var row=tables[0].insertRow(2);
        let c;
        c=row.insertCell();c.innerHTML='<b class="dblock p2">'+(result.my[0])+'</b>';c.className='red_color borderr';
        c=row.insertCell();c.innerHTML='<b class="dblock p2">'+(result.my[1])+'</b>';c.className='red_color borderr';
        c=row.insertCell();c.innerHTML='<b class="dblock p2">'+(result.my[2])+'</b>';c.className='red_color';
        row=tables[1].insertRow(2);
        for(let i in local_army.units){
            c=row.insertCell();c.innerHTML='<b class="dblock p2">'+(result.enemy[local_army.units[i].type-4])+'</b>';c.className='red_color borderr';
        }
        c.className='red_color';
    }

    this.updateAttackEvent=function(){
        let inputs=document.querySelectorAll('#town_event input[type="number"]');
        if(inputs.length==3){
            let bme=win.ng_data.info._event.power
            let tables=document.querySelectorAll('#town_event .g_table')
            let tr=tables[0].insertRow(2);
            let tre=tables[1].insertRow(2);


            let calc=function(){
                let result={my:[0,0,0],enemy:[0,0,0,0,0]};
                let my=[Number(inputs[0].value),
                        Number(inputs[1].value),
                        Number(inputs[2].value)
                       ],
                    enemy=[0,0,0,0,0];
                let bm=0;
                my.forEach((inp,ind)=>{
                    bm+=inp*unitsmy[ind];
                });
                for(let i=1;i<=3;i++){
                    enemy[i]=win.ng_data.info._event.units
                }
                if(bm>0){
                    if(bm>bme){
                        result.my=calcDeath(bme,bm,my,unitsmy);
                        result.enemy=enemy
                    }else{
                        result.enemy=calcDeath(bm,bme,enemy,units);
                        result.my=my;
                    }
                }
                tr.innerHTML='';
                let c;
                for(let i=0;i<3;i++){
                    c=tr.insertCell();
                    c.textContent=result.my[i];
                }
                tre.innerHTML='';
                for(let i=1;i<4;i++){
                    c=tre.insertCell();
                    c.textContent=result.enemy[i];
                }

            }
            for(let i=0;i<3;i++){
                inputs[i].addEventListener('change',calc)
            }
            calc();
        }
    }
	let exp_table=[0];
	let exp_val=0,exp_current=0;
	for(let i=0;i<20;i++){
		exp_val+=50+i*100;
		exp_current+=exp_val;
		exp_table.push(exp_current);
	}

    const sortHeroes=function(track){
		let list=win.ng_data.info._hero_list
		let exp={};
		for(let i in list){
			exp[i]=exp_table[list[i].lvl]+Number(list[i].exp);
		}
        let heroes=Array.from(track.querySelectorAll('.heroes')).sort((a,b)=>{
			return exp[b.dataset.id]-exp[a.dataset.id]
		})
		heroes.forEach(h=>{
			track.appendChild(h)
		});
    }
    this.updateHeroListWin=(el)=>{
        if(!el)el=document.querySelector('#place10');
        watch(el.querySelector('.custom_scroll'),{childList:true},function(list){
            for(let m of list){
                m.addedNodes.forEach(sl=>{
                    if(!sl.querySelector)return;
                    let track=sl.querySelector('.slick-track');
                    if(track) sortHeroes(track);
                })
            }
        })
        sortHeroes(el.querySelector('.g_slider_vertical'));
	}
    this.updateHeroWin=()=>{
        let but=document.querySelector('#building10_units .button[data-hero_id]');
        if(but){
            let hero=win.ng_data.info._hero_list[but.dataset.hero_id];
            let tr=document.querySelector('#building10_units .g_table').rows[1];
            for(let i=0;i<tr.cells.length;i++){
                let td=tr.cells[i];
                let b1=document.createElement('div');
                b1.className='button small';
                b1.textContent='мин';
                b1.onclick=function(){let inp=this.parentNode.querySelector('input');inp.value=1;inp.dispatchEvent(new Event('change'));}
                td.appendChild(b1);

                b1=document.createElement('div');
                b1.className='button small';
                b1.textContent='МАКС';
                b1.onclick=function(){let inp=this.parentNode.querySelector('input');inp.value=Math.min(inp.max,hero.max_units);inp.dispatchEvent(new Event('change'));}
                td.appendChild(b1);
            }
        }
    }
    return this;
}
// misc
    var div,show=true;

    var processClick=function(el){
        if(el.classList){
            if(el.classList.contains('button')||el.classList.contains('hero_attack')){
                if(el.dataset.action=='attack' && el.dataset.island_point){
                    return setTimeout(fight.updateAttackWindow,100,el.dataset.island_point);
                }
            }
            if(el.classList.contains('hero_units_cmd')){
                return setTimeout(fight.updateHeroWin,100);
            }
            if(el.dataset.menu=='town_event'){
                return setTimeout(fight.updateAttackEvent,100);
            }
        }
    }
    document.body.addEventListener('click',function(event){
        for(var i in event.path){
            if(processClick(event.path[i])){
                return;
            }
        }
    });
    document.body.addEventListener('keypress', function(event){
        if(event.path[0].className=='g_chat_your_message'){
            return;
        }
		switch(event.code){
			case 'KeyH':{
				show=!show;
				if(div){
					div.style.display=show?'':'none';
				}
                island_timers.showHide(show);
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
    var fixMarket=function(el){
        const fix=(el)=>{
            var tables=el.querySelectorAll('.g_table')
            var lots=win.ng_data.info._castle_data[9].data.orders;
            if(tables.length==4){
                tables.forEach((table,index)=>{
                    let res=index+1
                    for(let i=0;i<table.rows.length;i++){
                        table.rows[i].cells[1].innerHTML='<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+table.rows[i].cells[1].innerHTML+storage.get(lots[res][i].pid)+'</div>'
                    }
                })
            }
        }
        watch(el.querySelector('.custom_scroll'),{childList:true},function(list){
            for(let m of list){
                m.addedNodes.forEach(sl=>{
                    if(!sl.classList)return;
                    if(sl.classList.contains('custom_scroll')) fix(sl)
                });
            }
        });
        fix(el);
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
	transition:0.5s;
	position:fixed;
	left:0;
	bottom:0;
	padding: 10px;
	border-radius: 0 10px 0 0;
	z-index:10;
	opacity: 0.8;
	font-size: 14pt;
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
            if(event && event.done=="0" && show){
                div.innerHTML='<div class="eb"><div class="timer"></div></div>'
                div.querySelector('.eb').style.backgroundImage='url(/static/images/events/npc'+String(event.type).padStart(2,'0')+'_'+String(event.complexity).padStart(2,0)+'.png)';
                setTimer(div.querySelector('.timer'),event.time);
            }
            else{
                div.innerHTML='';
            }
        }
    })()
    var fixBuildTimer=function(el){
        let ut=el.getAttribute('timer_end_popup');
        if(ut){
            let endDate=new Date(Number(ut+'000'));
            let nowDate=new Date();
            let d= document.createElement('div');
            d.textContent='Завершение '+(nowDate.toLocaleDateString()==endDate.toLocaleDateString()?'':endDate.toLocaleDateString('ru-RU'))+' в '+endDate.toLocaleTimeString('ru-RU');
            d.style='text-align:center';
            el.parentNode.appendChild(d);
        }
    }
    
    const addToBody=function(el){
		if(!show)return;
        let tmp=el.querySelector('.small_count');
        if(tmp) fixBuildTimer(tmp);
        tmp=el.querySelector('.middle_count');
        if(tmp) fixBuildTimer(tmp);
        		
        if(el.id=='place9'){
            fixMarket(el);
        }else if(el.id=='place10'){
            fight.updateHeroListWin(el);
        }else if(el.id=='town_event'){
            events.updateWindow(el);
        }
    }
    watch(document.body,{childList:true},function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if(mutation.type=='childList'){
                mutation.addedNodes.forEach(addToBody)
            }
        }
    });
    
});
