// ==UserScript==
// @name         Комфортное Эльдорадо
// @namespace    http://eldorado.botva.ru/
// @version      0.14.3
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

        // Создаем экземпляр наблюдателя с указанной функцией обратного вызова
        const observer = new MutationObserver(cb);

        // Начинаем наблюдение за настроенными изменениями целевого элемента
        observer.observe(target, config);
    }


    win.jQuery(document).ajaxComplete( function( event, xhr, options ){
        if(options.url==win.cmd_link){

            try{
                if(xhr.responseJSON.result.island_data){
                    updateNames(xhr.responseJSON.result.island_data,xhr.responseJSON.result.continent_index,xhr.responseJSON.result.island_index);
                }
            }catch(e){console.error(e)}
            try{
                displayEvent(xhr.responseJSON.info._event);
            }catch(e){console.error(e)}
            /*
            try{
                createMoneyTimer(xhr.responseJSON.info);
            }catch(e){console.error(e)}
            */
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
                    case 'get_rating':{
                        updateTop(xhr.responseJSON.result.rating);
                        break;
                    }
                    case 'get_pvp_info':{
                        updatePlayerInfo(params,xhr.responseJSON.result.pvp_data);
                        break;
                    }
                    case 'get_report':{
                        mailBox.report(xhr.responseJSON.result.report);
                        break;
                    }
                    case 'stash_send_squad':{
                        let data;
                        try{
                            data=store.get('last_fight',[])
                        }catch(e){
                            data=[]
                        }
                        let coord=params.get('coord1')+':'+params.get('coord2')+':'+params.get('coord3');
                        let exists=data.indexOf(coord)
                        if(exists>-1){
                            data.splice(exists,1);
                        }
                        data.unshift(coord);
                        store.set('last_fight',data);
                        break;
                    }
                    case 'get_town_data':
                        fix.get_town_data(xhr.responseJSON.result.town_data);
                    break;
                }
            }catch(e){}
            try{
                island_timers.setTimer(xhr.responseJSON.info._hero_list);
            }catch(e){}
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
            var active=[];
            if(win.ng_data.info._hero_map){
                active=Object.values(win.ng_data.info._hero_map)
            }
            if(win.ng_data.info._building_progress){
                if(win.ng_data.info._building_progress.length>0 ){
                    win.ng_data.info._building_progress.forEach(b=>{
                        text.push('<tr><td colspan="5" style="text-align:right">'+win.getLang('building_name'+b.building)+'</td><td>'+endTime(b.timer*1000)+'</td></tr>');
                    })
                }else{
                    text.push('<tr><td colspan="6" style="text-align:center"><b style="color:red">УЛИТКИ ОТЛЫНИВЮТ, ЗАПУСТИ СТРОЙКУ!!!</b></td><tr>');
                }
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
                let energy=Math.min(Number(hero.energy)+Math.floor((now-new Date(Number(hero.energy_time)*1000))/50000),hero.max_energy);
                let work=(hero.work?endTime(Number(hero.work.end+"000")):'');
                 if (work==''){
                     work=`<b class="icon icon_energy"></b>: ${energy}/${hero.max_energy}`;
                 }
                text.push(`<tr `+(active.indexOf(i)>-1?' style="font-weight:bolder"':'')
                          +`><td><b class="icon icon_level"></b>${hero.lvl}</td><td>`
                          +win.getLang('name_card'+timers[i].type)+`</td><td>`+units.join(' ')+`</td><td><b class="icon icon_exp"></b> ${hero.exp}/${hero.max_exp}</td><td>`
                          +res.join(' ')+`</td><td>`+work+`</td></tr>`);

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
var calcDeath=function(t,a,r,c){let e=t/Math.sqrt(a);return r.map((r,h)=>Math.ceil(e*(r*c[h]/a)*Math.sqrt(t/c[h]/c[h])))};

    var store=new function(){
        this.load=this.get=function(name,def){
            let v;
            try{
                v=JSON.parse(decodeURI(GM_getValue(name)))
            }catch(e){
                v=def;
            }
            return v;
        }
        this.set=this.save=function(name,value){
            GM_setValue(name,encodeURI(JSON.stringify(value)));
        }
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
    let data=store.get('events');//JSON.parse(decodeURI(GM_getValue('events')));
    if(data){
        _data=data;
    }
}catch(e){
}
    var save=function(){
        store.set('events',_data);
        //GM_setValue('events',encodeURI(JSON.stringify(_data)));
    }
    var getType=()=>{
        switch(Number(win.ng_data.info._event.type)){
            case 4:return "ushan";break;
            case 3:return "gena";break;
        }
        return false;
    }
    this.select=function(boxes,select){
        let type=getType();
        if(type===false) return;
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
        table.style=`margin-right: auto;
    width: 450px;`;
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
const _fixName=(name)=>String(name).replace(/</g,'&lt;');
var storage=new function(){
    var data={},db;
    var updateStorage=function(){
        clearTimeout(timer);
        timer=setTimeout(()=>{
            store.set('pid_names',data);
            //GM_setValue('pid_names', encodeURI(JSON.stringify(data)));
        },1000)
    }
    try{
        db=store.get('pid_names');// decodeURI(GM_getValue('pid_names'));
            /*
        if(!db){
            db=win.localStorage.getItem('pid_names');
            if(db){
                updateStorage();
                setTimeout(()=>win.localStorage.removeItem('pid_names'),10000);
            }
        }
        db=JSON.parse(db);
        */
        if(db){
            data=db;
        }
    }catch(e){}
    var timer=false;
    this.getPlayerByCoord=function(a,i,p){
        let d
        for(let k in data){
            d=data[k];
            if(d.cont==a && d.island==i && d.caslte==p){
                return d
            }
        }
    }
    this.getByCoord=function(a,i,p){
        let d=this.getPlayerByCoord(a, i, p);
        if(d) return _fixName(d.name)
    }
    this.get=function(id){
        if(id in data){
            return _fixName(data[id].name)
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
        let used={};
        for(let i in data){
            if(data[i].cont==id){
                if(!(data[i].island in stat)){
                    stat[data[i].island]=0;
                }
                let pos=data[i].island+':'+data[i].castle
                if(!used.hasOwnProperty(pos)){
                    used[pos]=true;
                    if(stat[data[i].island]<6){
                        stat[data[i].island]++;
                    }
                }
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
        let data=store.get('fight_stat');//JSON.parse(decodeURI(GM_getValue('fight_stat')));
        if(data){
            _data=data;

        }
    }catch(e){
    }
    var save=function(){
        store.save('fight_stat',_data);
        //GM_setValue('fight_stat',encodeURI(JSON.stringify(_data)));

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
        let _hero=win.ng_data.info._hero_list[win.ng_data.current_hero_info_data.hero];
        let my=[Number(_hero.unit_1),
                Number(_hero.unit_2),
                Number(_hero.unit_3)
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
        };
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
    var fixHeroesWin=(function(){

        var slideScroll=0;
        var scrollSize=3;
        var slickAnimate=false;
        var initTimer;
        var startPos;
        var afterScroll=function(event,slick,currentSlide){
           slideScroll=currentSlide;
           clearTimeout(initTimer);
           initTimer=setTimeout(function(){
               if(startPos!==false){
                   var pos=startPos;startPos=false;
                   slick.slickGoTo(pos,true);
               }
           },10)
        }
        var wheel=function(e) {
            e.preventDefault();
            var goSlick;
            if (e.originalEvent.deltaY > 0) {
                goSlick=Math.min(
                    slideScroll+scrollSize,
                    this.slick.slideCount-this.slick.originalSettings.slidesToShow
                )
            } else {
                goSlick=Math.max(0,slideScroll-scrollSize)
            }
            win.jQuery(this).stop(1,1).slick('slickGoTo',goSlick,slickAnimate);
            slideScroll=goSlick;
        }
        var fix=function(div){
            var slider=win.jQuery(div);
            div.slick.slickSetOption({
                slidesToShow:7,
                initialSlide:slideScroll
            },true)
            slider
                .off('afterChange',afterScroll)
                .on('afterChange',afterScroll)
                .off('wheel', wheel)
                .on('wheel', wheel);

        }

        return function(el,noinit){

            var div=el.querySelector('.g_slider_vertical.heroes');
            if(div.slick)return fix(div);
            watch(div,{
                childList:true
            },function(list){
                for(let m of list){
                   m.addedNodes.forEach(el=>{
                      if(el.classList.contains('slick-track')){
                          if(el.childNodes.length>0 && div.slick){
                              fix(div)
                          }
                      }
                    })
                }
            })
                startPos=slideScroll;
        };
    })()
    this.updateHeroListWin=(el)=>{
        return;
        if(!el)el=document.querySelector('#place10');
        watch(el.querySelector('.custom_scroll'),{childList:true},function(list){
            for(let m of list){
                m.addedNodes.forEach(sl=>{
                    if(!sl.querySelector)return;
                    fixHeroesWin(el,true);
                })
            }
        })
        fixHeroesWin(el)
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
                b1.textContent='1';
                b1.onclick=function(){let inp=this.parentNode.querySelector('input');inp.value=1;inp.dispatchEvent(new Event('change'));}
                td.insertBefore(b1,td.querySelector('div.button:last-child'));
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
    var mailBox=new function(){
        let box=store.get('mail',{});
        let to
        let save=function(){
            clearTimeout(to)
            to=setTimeout(()=>{store.set('mail',box)},100);
        }
        this.mail=function(id,mail){
            box[id]=Object.assign(box[id]||{},mail);
            save()
        }
        this.report=function(report){
            if(report.report_id){
                box[report.report_id]=Object.assign(box[report.report_id]||{},report);
                save();
            }
        }
        this.get=function(id){
            return box[id];
        }
        this.getEnemyLast=function(name){
            let letters=[];
            for(let i in box){
                if(box[i].result && box[i].enemy_name==name)
                    letters.push(box[i])
            }
            return letters;
        }
        console.log(box);
    }
    document.body.addEventListener('click',function(event){
        for(var i in event.path){
            if(processClick(event.path[i])){
                return;
            }
        }
    });
    document.addEventListener('focusin',function(event){

    })
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
            case 'KeyI':{
                let active=document.querySelector('.global_map_container.active')
                if(!active.classList.contains('map_island')){
                    active.classList.remove('active');
                    document.querySelector('.global_map_container.map_island').classList.add('active');

                }
                break;
            }
            case 'KeyA':{
                let active=document.querySelector('.global_map_container.active')
                if(!active.classList.contains('map_continent')){
                    active.classList.remove('active');
                    document.querySelector('.global_map_container.map_continent').classList.add('active');

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

    var updateNames=function(data,cont,isl){
        [22,25,28,31,34,37].forEach(i=>{
            if(data[i].pid>''){
                storage.set(data[i].pid,{cont:Number(cont),island:Number(isl),name:data[i].name,lvl:Number(data[i].level),castle:i})
            }
        })
    }
    var updateTop=function(data){
        for(var i in data){
            storage.set(data[i].id,{cont:Number(data[i].continent),island:Number(data[i].island),name:data[i].name,lvl:Number(data[i].level),caslte:Number(data[i].castle)})
        }
    }
    var updatePlayerInfo=function(params,data){
        storage.set(data.id,{
            cont:Number(params.get('continent')),
            island:Number(params.get('island')),
            name:data.name,
            lvl:Number(data.main_level),
            caslte:Number(params.get('castle'))
        })
    }
    var displayIsland=function(data){
        if(show){
            for(let i in data){
                //if(data[i].can_attack==1){
                try{
                    let el=document.querySelector('.town_block[data-index="'+i+'"]').querySelector('.map_item_number')
                    if(!el){
                        continue;
                    }
                    el.textContent=data[i].local_army.army_power;
                    el.style.opacity=1;
                }catch(e){}
                //}
            }
        }
    }
    var hideIsland=function(){
        document.querySelectorAll('.map_item_number').forEach(el=>{
            el.textContent=el.parentNode.parentNode.dataset.index;
            el.style.opacity=null;
        })
    }
    var updateContinent=function(id){
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
    /*
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
                        value=Math.max(info[type].max,info[type].value)
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
    */
    var endTime=function(endtime){
        let time=endtime-Date.now();
        if(time<0){
            return '';
            //el.textContent='--:--:--';
            //clearTimer();
        }else{
            let s=Math.floor(time/1000);
            let m=Math.floor(s/60);
            let h=Math.floor(m/60);
            let d=Math.floor(h/24);
            return (d > 0 ? d + ' д. ' : '') + [h % 24, m % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':');
        }
    }
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
                let time=endTime(endtime);
                if(time==''){
                    el.textContent='--:--:--';
                    clearTimer();
                }else{
                    el.textContent=time;
                }
            })
        }
        return function(event){
            clearTimer();
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
    var buildEndTime=function(endDate){
        let nowDate=new Date();
        return (nowDate.toLocaleDateString()==endDate.toLocaleDateString()?'':endDate.toLocaleDateString('ru-RU'))+' в '+endDate.toLocaleTimeString('ru-RU')
    }
    var fixBuildTimer=function(el){
        let ut=el.getAttribute('timer_end_popup');
        if(ut){
            let endDate=new Date(Number(ut+'000'));
            let d= document.createElement('div');
            d.textContent='Завершение '+buildEndTime(endDate);
            d.style='text-align:center';
            el.parentNode.appendChild(d);
        }
    }
    var fixBuildInfo=function(title,window){
        if(title.textContent.trim()==String(win.lang_data.requirements).trim()){
            let placeId=window.id.replace('place');

        }
    }

    var fixInventory=function(el){
        // let book;
        let text=[];
        /*
        Object.values(win.ng_data.info.effects).some(v=>(book=v.type==1231?v:null));
        if(book){
            text.push('Следующая книга переноса будет достуна: '+buildEndTime(new Date(book.time_to*1000)));
        }else{
            text.push('У вас 2 книги переноса замка');
        }
        */
        let boost=0;
        let boostType={
            1:5,
            2:15,
            3: 30,
            4: 60,
            5: 120,
            6: 300,
            7: 600,
        }
        Object.values(win.ng_data.info._items).forEach(i=>{
            if(boostType[i.type]){
                boost+=boostType[i.type]*Number(i.amount)*60;
            }
        })
        if(boost>0){
            if(win.ng_data.info._building_progress[0]){
                let bp=win.ng_data.info._building_progress[0];
                let end=Number(bp.timer)-boost;
                let now=new Date().valueOf()/1000;
                if(now<end){
                    text.push('Ускоряшек до '+buildEndTime(new Date(end*1000)));
                }else{
                    text.push('Ускоряшек хватает на завершение стройки');
                }
            }
        }
        let desc=el.querySelector('.inventory_desc');
        text.forEach(t=>{
            let d=document.createElement('div')
            d.className='p10 ta_c';
            d.textContent=t
            desc.appendChild(d);
        })
    }
    /*
    var fixBadMan=function(el){
        var body=el.querySelector('.g_body')
        body.querySelector('p').remove();
        let table=document.createElement('table')
        table.className='g_table mb5 ta_c';
        var createRow=function(list,first){
           var row=table.insertRow();
            const last=list.length-1;
           list.forEach((item,i)=>{
               let c=row.insertCell();
               c.className=(first?('w25p'):(i>0?'ta_r':'ta_l'))+(i==last?'':' borderr');
               c.innerHTML=item;
           })
        }
        createRow(['Игрок','<b class="icon icon_unit1" title="Улитка"></b>','<b class="icon icon_unit2" title="Сурок"></b>','<b class="icon icon_unit3" title="Пчёл"></b>'],true);
        Object.values(win.ng_data.info._event_badman.mates).forEach(i=>createRow([i.name,win.digits(i.unit_1),win.digits(i.unit_2),win.digits(i.unit_3)]))
        body.appendChild(table);
    }
    */
   const addFight=function(event){
        let m=String(this.dataset.coord).match(/(\d+);(\d+);(\d+)/)
        if(m){
            localStorage.setItem('stash_coord1','"'+m[1]+'"');
            localStorage.setItem('stash_coord2','"'+m[2]+'"');
            localStorage.setItem('stash_coord3','"'+m[3]+'"');

            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }
    var _confirmation = function(conf){
        return new Promise((d,e)=>{
            win.$('#confirmation').remove();

            var text = conf.text;

            var content = '<div class="ta_c">\
<div class="pb10">' + text + '</div>\
<div class="button w100 ng_confirm_btn">' + win.getLang('cmd_confirm') + '</div>\
<div class="button w100 red" onclick="removeModal({id: \'confirmation\'});">' + win.getLang('cmd_cancel') + '</div>\
</div>';
            if(!conf.data)conf.data={};
            conf.data.close = 'confirmation';

            var callback = conf.callback || function(){};
            var before = conf.before || function(){};

            setTimeout(function(){
                win.modal('js', {
                    id: 'confirmation',
                    width: 350,
                    title: win.getLang('confirmation_title'),
                    simple: 1,
                    overlay: true,
                    bind_close: false,
                    content: content,
                    open: function(){
                        win.$(conf.obj).removeClass('busy');

                        win.$('#confirmation .ng_confirm_btn')
                            .off('click')
                            .on('click', function(){
                            before();
                            setTimeout(()=>{
                                win.removeModal({id: 'confirmation'});
                            },10)
                            return d();

                        });
                    },
                    close(mode){
                        e(mode);
                    }
                });
            }, 200);
        })
    };
    const getDateText=date=>date.toLocaleDateString(win.lang,{month:'long',day:'numeric'});
    const formatTime=(time)=>{
        const date=new Date(Number(time+'000'))
        const currentDate=getDateText(new Date());
        const datestr=getDateText(date);
        return (datestr!=currentDate?datestr+' ':'')+date.toLocaleTimeString(win.lang);
    }
    const getLootImage=function(data){
        var award_modifier = 's';
        var award_item='';
        var award_amount = data.amount > 1 ? win.digits(data.amount): '';
        if(data.type == 'money'){
            award_item = win.getLang('icon_money'+data.what);
        }

        if(data.type == 'res'){
            award_item = '<img src="static/images/items/res' + data.what + award_modifier + '.png"  style="max-width:20px;max-height:20px;vertical-align: bottom;"/>';
        }

        if(data.type == 'unit'){
            award_item = '<img src="static/images/units/unit' + data.what + award_modifier + '.jpg"  style="max-width:20px;max-height:20px;vertical-align: bottom;"/>';
        }

        if(data.type == 'item'){
            award_item = '<img src="static/images/items/' + data.what + award_modifier + '.png"  style="max-width:20px;max-height:20px;vertical-align: bottom;"/>';
        }

        if(data.type == 'pumpkins'){
            award_item = '<img src="static/images/items/pumpkin' + award_modifier + '.png"  style="max-width:20px;max-height:20px;vertical-align: bottom;"/>';
        }

        if(data.type == 'event' && data.what == 'elf'){
            award_item = '<img src="static/images/items/gnome' + award_modifier + '.png"  style="max-width:20px;max-height:20px;vertical-align: bottom;"/>';
        }

        if(data.type == 'card'){
            award_item = '<img src="static/images/cards_npc/' + data.what + '.jpg" class="item_card_image" />';
        }

        if(data.type == 'exp'){
            award_item = win.getLang('img_exp');
        }

        if(data.type == 'glory'){
            award_item = win.getLang('img_money4');
        }

        return award_amount +' '+award_item + ' ';
    }
    const fix={
        _report_name:(report)=>{
            if(!report)return;
            let m
            if(report.name){
                m=report.name.match(/^(\d+):(\d+):(\d+)$/);
                if(m){
                    let newname=storage.getByCoord(m[1],m[2],m[3]);
                    if(newname != undefined){
                        report.name=newname+' ['+m[0]+']';
                    }
                }
            }
            if(report.enemy_name){
                m=report.enemy_name.match(/^(\d+):(\d+):(\d+)$/);
                if(m){
                    let newname=storage.getByCoord(m[1],m[2],m[3]);
                    if(newname != undefined){
                        report.enemy_name=newname+' ['+m[0]+']';
                    }
                }
            }
        },        
        place2(el){
            const init=el=>{
                watch(el,{childList:true},function(list){
                    for(let m of list){
                        m.addedNodes.forEach(sl=>{
                            if(!sl.classList)return;
                            if(sl.classList.contains('mail_status')) fixWindow(sl)
                        });
                    }
                });

            }
            const fixWindow=(el)=>{
                let report_link=el.querySelector('[data-report_id]');
                if(report_link){
                    let id=report_link.dataset.report_id;
                    let letter;
                    for(let i in win.ng_data.mail_list){
                        if(win.ng_data.mail_list[i].type=='1'
                           && win.ng_data.mail_list[i].var1==id
                          ){
                            letter=win.ng_data.mail_list[i];
                            break;
                        }
                    }
                    if(letter){
                        let report=mailBox.get(id);
                        fix._report_name(report);
                        mailBox.mail(id,letter);
                        if(!report || !report.result){
                            el.style.backgroundColor='rgba(255, 255, 0,0.29)';
                        }else if(report && report.result){
                            report_link.previousSibling.textContent='Бой между '+report.name+' ⚔️ '+(report.enemy_name?report.enemy_name:win.getLang('report_win_monsters'))+'. '
                            let txt=[];
                            if(report.pattern==6||report.pattern==7||report.pattern==1){
                                report.loot.forEach(l=>{
                                    txt.push(getLootImage(l)/*win.digits(l.amount)+
                                             (l.type=='money'
                                              ?win.getLang('icon_money'+l.what)
                                              :'<img src="/static/images/items/'+l.what+'s.png" style="max-width:20px;max-height:20px;vertical-align: bottom;"/>' )
                                              */
                                           )
                                })
                            }
                            if(report.pattern==6){
                                // die
                                if(txt.length>0){
                                    let d=document.createElement('div');
                                    d.innerHTML='Потери: <span class="red_color">'+txt.join(' ')+'</span>';
                                    report_link.parentNode.appendChild(d)
                                }
                            }
                            if(report.pattern==7||report.pattern==1){
                                // win
                                //console.log(report.loot);
                                if(txt.length>0){
                                    let d=document.createElement('div');
                                    d.innerHTML='Добыча: <span class="green_color">'+txt.join(' ')+'</span>';
                                    if(report.pattern==1){
                                        d.innerHTML+=' Потери: <span class="red_color">'+Object.keys(report.units_killed).map(k=>{
                                            if(report.units_killed[k]>0){
                                                return report.units_killed[k]+' '+win.getLang('icon_unit'+k)
                                            }return '';
                                        }).join(' ')+'</span>'
                                    }
                                    report_link.parentNode.appendChild(d)
                                }
                            }
                        }
                    }
                }
            }
            watch(el.querySelector('.custom_scroll'),{childList:true},function(list){
                for(let m of list){
                    m.addedNodes.forEach(sl=>{
                        if(!sl.classList)return;
                        if(sl.classList.contains('mail_list')) init(sl)
                    });
                }
            });
            init(el.querySelector('.mail_list'));
        },
        rating(el){
            Array.from(el.querySelectorAll('.tab_block[data-tab="1"] .rating_cont.custom_scroll tr'))
                .forEach(row=>{
                let b=document.createElement('b');
                b.className='icon';
                b.style.backgroundPosition='-80px -60px';
                b.dataset.coord=row.cells[2].textContent;
                b.onclick=addFight;
                row.cells[2].insertBefore(b,row.cells[2].firstChild);
            })
        },
        report(el){
            var myBm=0,enBm=0,myBmd=0,enBmd=0;
            if(win.ng_data.report){
                let report=win.ng_data.report;
                fix._report_name(report)
                let bm={};
                for(let i in win.ng_data.config_units){
                    bm[i]=win.ng_data.config_units[i][0]*win.ng_data.config_units[i][1];
                }
                for(let i in report.my_unit_types){
                    let t=report.my_unit_types[i]
                    myBm+=bm[t]*report.units[i];
                    myBmd+=bm[t]*report.units_killed[i];
                }
                for(let i in report.enemy_unit_types){
                    let t=report.enemy_unit_types[i]
                    enBm+=bm[t]*report.enemy_units[i];
                    enBmd+=bm[t]*report.enemy_units_killed[i];
                }
                let table=el.querySelector('.g_table');
                table.rows[0].cells[0].querySelector('b.red_color').textContent=report.name;
                table.rows[0].cells[1].querySelector('b.green_color').textContent=report.enemy_name;
                
                let row=table.insertRow()
                let td=row.insertCell()
                td=row.insertCell()
                td.colSpan=3;
                td.className='borderr';
                td.textContent='Потери: '+(myBm>0?(Math.round(myBmd*100000/myBm)/1000)+'%':'-');
                td=row.insertCell()
                td.colSpan=3;
                td.textContent='Потери: '+(enBm>0?(Math.round(enBmd*100000/enBm)/1000)+'%':'-');
                td=row.insertCell()

            }
        },
        st_events(el){
            setTimeout(()=>{
                el.querySelector('.container').style.width='700px';
                el.querySelector('.custom_scroll').style.maxHeight='calc(100vh - 175px)'
            },10);            
            let rows=el.querySelectorAll('table tr');
            let my=win.ng_data.info._pvp_data.events_my;
            rows.forEach(row=>{
                let t=row.cells[1];
                let m=t.textContent.match(/(\d+)\s(\d+)\s(\d+)/);
                let newname=storage.getByCoord(m[1],m[2],m[3]);
                if(newname != undefined){
                    t.textContent=newname+' ['+m[1]+':'+m[2]+':'+m[3]+']';
                }
                let timer=row.querySelector('[timer_end_popup]');
                let time=timer.getAttribute('timer_end_popup');
                let info;
                for(let i in my){
                    if(my[i].continent==m[1] && my[i].island==m[2] && my[i].castle==m[3] && my[i].time==time){
                        info=my[i];
                        break;
                    }
                }
                if(info && info.type==3 && row.cells.length==4){
                    let cell=row.cells[2];
                    cell.appendChild(document.createElement('br'));
                    cell.appendChild(document.createTextNode(win.digits(info.loot_gold)));
                    let b=document.createElement('b');
                    b.className='icon icon_money1'
                    b.setAttribute('title',win.lang_data.name_money1);
                    cell.appendChild(b);
                    cell.appendChild(document.createTextNode(win.digits(info.loot_gems)));
                    b=document.createElement('b');
                    b.className='icon icon_money2'
                    b.setAttribute('title',win.lang_data.name_money2);
                    cell.appendChild(b);
                }
            })
            console.log('pvp',el);
        },
        building5_units(el){
            let button=el.querySelector('[data-cmd="stash_send_squad"]');
            if(button){
                let letters=mailBox.getEnemyLast(button.dataset.coord1+':'+button.dataset.coord2+':'+button.dataset.coord3).sort((a,b)=>(Number(a.time)>Number(b.time)?-1:1)).slice(0,10);
                if(letters.length>0){
                    let div=document.createElement('div');
                    div.className='g_title';
                    div.textContent='Прошлые атаки';
                    button.parentNode.appendChild(div);
                    div=document.createElement('div');
                    div.className='g_body';
                    let t=document.createElement('table');
                    t.className='g_table borderb mb10 ta_c';
                    let tr=document.createElement('tr');
                    tr.innerHTML='<td class="borderr"></td><td class="borderr">'+win.getLang('icon_unit1')+'</td><td class="borderr">'+win.getLang('icon_unit2')+'</td><td class="borderr">'+win.getLang('icon_unit3')+'</td><td class="borderr">'+win.getLang('icon_money1')+'</td><td class="">'+win.getLang('icon_money2')+'</td><td></td>';
                    t.appendChild(tr);
                    letters.forEach(l=>{
                        tr=document.createElement('tr');
                        let c=tr.insertCell();
                        c.textContent=formatTime(l.time)
                        c.className='borderr';
                        c=tr.insertCell();
                        c.className='borderr';
                        c.textContent=win.digits(l.enemy_units[1]);
                        c=tr.insertCell();
                        c.className='borderr';
                        c.textContent=win.digits(l.enemy_units[2]);
                        c=tr.insertCell();
                        c.className='borderr';
                        c.textContent=win.digits(l.enemy_units[3]);
                        c=tr.insertCell();
                        c.className='borderr';
                        c.textContent=win.digits((l.loot && l.loot.length>0)?l.loot[0].amount:'-');
                        c=tr.insertCell();
                        c.textContent=win.digits((l.loot && l.loot.length>1)?l.loot[1].amount:'-');
                        c=tr.insertCell();
                        c.innerHTML=(l.loot && l.loot.length>2)?getLootImage(l.loot[2]):'';
                        t.appendChild(tr);
                    })
                    div.appendChild(t);
                    button.parentNode.appendChild(div);
                    if(letters.length>0){
                        let units_types=letters[0].my_unit_types;
                        let units=letters[0].units;
                        if(units){
                            for(let k in units_types){
                                let inp=el.querySelector('input.unit'+units_types[k]);
                                if(inp){
                                    inp.value=Math.min(inp.max,units[k]);
                                }
                            }
                        }
                    }
                }
            }
        },
        profile_dis(el){
            let profile=win.ng_data.profile;
            let div=document.createElement('div');
            div.className='button small cmd_send_squad';
            div.dataset.cmd='stash_send_squad';
            div.dataset.coord1=profile.continent;
            div.dataset.coord1=profile.island;
            div.dataset.coord1=profile.castle;
            div.textContent='Отправить отряд';
            el.querySelector('div.container > div.content > div').appendChild(div);
            //debugger;
        },
        place9(el){
            const fix=(el)=>{
                var tables=el.querySelectorAll('.g_table')
                var lots=win.ng_data.info._castle_data[9].data.orders;
                if(tables.length==4){
                    tables.forEach((table,index)=>{
                        let res=index+1
                        let len=Math.min(lots[res].length,table.rows.length);
                        for(let i=0;i<len;i++){
                            table.rows[i].cells[1].innerHTML='<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+
                                table.rows[i].cells[1].innerHTML.replace(/1\s+<b class="icon icon_res."><\/b>\s+за\s+/,'')
                                +storage.get(lots[res][i].pid)+'</div>'
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
        },
        place5(el){
            let fix=function(el){
                if(!el)return;
                if(!el.classList.contains('tab_block')) return;
                if(el.dataset.tab!=2) return;
                let last=store.get('last_fight');
                let tab=el;
                //console.log('last_fight',last,tab);
                let div=document.createElement('div');
                let title=document.createElement('div');
                title.textContent='Прошлые нападения'
                title.className='g_title mt10';
                div.appendChild(title);
                let body=document.createElement('div');
                body.className='g_body dflex';
                body.style='    flex-wrap: wrap;';
                let setValue=function(inp,value){
                    inp.value=value;
                    inp.dispatchEvent(new Event('change'));
                }
                let setCoord=function(coord){
                    setValue(el.querySelector('input.coord1'),coord[0]);
                    setValue(el.querySelector('input.coord2'),coord[1]);
                    setValue(el.querySelector('input.coord3'),coord[2]);
                }
                last.forEach(l=>{
                    let coord=l.split(':');
                    if(coord.length!=3)return;
                    let player=storage.getPlayerByCoord(coord[0],coord[1],coord[2]);
                    let name;
                    if(player){
                        name=_fixName(player.name);
                    }
                    let btn=document.createElement('div');
                    btn.className='button small'
                    btn.onclick=()=>{
                        setCoord(coord);
                    }
                    btn.textContent=(name||'')+' ['+l+']';
                    if(player){
                        btn.innerHTML=win.getLang('icon_level'+player.lvl)+' '+btn.innerHTML;
                    }
                    let X=document.createElement('span');
                    X.setAttribute('title','Удалить');
                    X.textContent=' X ';
                    X.style.color="red";
                    X.onclick=function(event){
                        let list=store.get('last_fight');
                        let i=list.indexOf(l);
                        if(i>-1){
                            _confirmation({
                                text:'Удалить '+(name||'')+' ['+l+'] из списка целей?',
                                obj: btn,
                            }).then(()=>{

                                list.splice(i,1);
                                console.log(list);
                                store.set('last_fight',list);
                                btn.parentNode.removeChild(btn);
                            })
                        }
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    }
                    btn.appendChild(X);
                    body.appendChild(btn);
                })
                div.appendChild(body);
                tab.appendChild(div);
            }
            watch(el.querySelector('.custom_scroll'),{childList:true},function(list){
                for(let m of list){
                    m.addedNodes.forEach(sl=>{
                        if(!sl.classList)return;
                        if(sl.classList.contains('custom_scroll')) fix(sl)
                    });
                }
            })
            fix(el.querySelector('.tab_block[data-tab="2"]'));
        },
        get_town_data(town){
            setTimeout(()=>{
                let timers=false;
                Object.keys(town._castle).forEach(k=>{
                    if(town._castle[k].timer){
                        let div=document.createElement('div');
                        div.setAttribute('timer_end_popup',town._castle[k].timer);
                        div.className='small_count day_on blue'
                        let c=document.querySelector('.building_block.pos'+k+' .building_block_content')
                        let t=document.createElement('div')
                        t.className='building_timer dark_bgr';
                        t.innerHTML='<br/>'+buildEndTime(new Date(town._castle[k].timer*1000))+'<br/>';
                        t.appendChild(div);
                        c.insertBefore(t,c.firstChild);
                        timers=true;
                    }
                })
                if(timers)win.start_timers('popup');
            },100)
        }
    }
    const addToBody=function(el){
        if(!show) return;
        el.querySelectorAll('.small_count,.middle_count').forEach(fixBuildTimer);

        let tmp=el.querySelector('.g_title.orange')
        if(tmp) fixBuildInfo(tmp,el)

        if(el.id=='place10'){
            fight.updateHeroListWin(el);
        }else if(el.id=='town_event'){
            events.updateWindow(el);
        }else if(el.id=='inventory'){
            fixInventory(el);
        }else if(el.id>'' && fix.hasOwnProperty(el.id)){
            fix[el.id](el);
        }
    }
    watch(document.body,{childList:true},function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if(mutation.type=='childList'){
                mutation.addedNodes.forEach(addToBody)
            }
        }
    });
    watch(document.querySelector('.map_continent .global_map_content'),{childList:true},function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if(mutation.addedNodes.length==37){
                updateContinent(win.ng_data.continent_index);
            }
        }
    })
    watch(document.querySelector('.map_island .global_map_content'),{childList:true},function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if(mutation.addedNodes.length==37){
                displayIsland(win.ng_data.island_data)
            }
        }
    })


});
