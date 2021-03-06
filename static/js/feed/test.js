(function() {
    const btnNewFeedModal = document.querySelector('#btnNewFeedModal');//+버튼
    if(btnNewFeedModal) {//+버튼이 있으면 
        const modal = document.querySelector('#newFeedModal');
        const body =  modal.querySelector('#id-modal-body');
        const frmElem = modal.querySelector('form');

        //이미지 값이 변하면
        frmElem.imgs.addEventListener('change', function(e) { //input name=imgs접근 type=file

            if(e.target.files.length > 0) { //선택한 파일 갯수 e.target=input(name=imgs)
                body.innerHTML = `
                    <div>
                        <div class="d-flex flex-md-row">
                            <div class="flex-grow-1 h-full"><img id="id-img" class="w300"></div>
                            <div class="ms-1 w250 d-flex flex-column">                
                                <textarea placeholder="문구 입력..." class="flex-grow-1 p-1"></textarea>
                                <input type="text" placeholder="위치" class="mt-1 p-1">
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-primary">공유하기</button>
                    </div>
                `;
                const imgElem = body.querySelector('#id-img');
                
                const imgSource = e.target.files[0];//선택한사진
                const reader = new FileReader();
                reader.readAsDataURL(imgSource);//내컴퓨터에있는 이미지의 위치값
                reader.onload = function() {//이미지가 로딩이됫다면 함수실행()
                imgElem.src = reader.result;//img태그.src에 이미지를 넣는다.
                };


                const shareBtnElem = body.querySelector('button');//공유하기 버튼
                shareBtnElem.addEventListener('click', function() {//fetch로 이미지를 백엔드에 전송
                    const files = frmElem.imgs.files;//이미지파일

                    const fData = new FormData();//creater element('form')
                    for(let i=0; i<files.length; i++) {
                        fData.append('imgs[]', files[i]);//fData안에 이미지를 배열로 집어넣는다.
                    }
                    fData.append('ctnt', body.querySelector('textarea').value);//문구에 들어간 문자열
                    fData.append('location', body.querySelector('input[type=text]').value);//위치에들어간 문자열

                    fetch('/feed/rest', {// post방식으로 body에 fData를 박아서
                        method: 'post',
                        body: fData
                    }).then(res => res.json())
                        .then(myJson => {
                            console.log(myJson);
                            const closeBtn = modal.querySelector('.btn-close');//btn.close를 찾고 클릭함(x버튼)
                            closeBtn.click();
                            // if(feedObj && myJson.result) { // 객체와 객체가 있다면
                            //     feedObj.refreshList(); //메소드호출(현재페이지를 1로바꾸고 공간초기화, 새로추가된것을 넣음 common_feed.js)
                            // }
                        });
                });
            }
        });

        btnNewFeedModal.addEventListener('click', function() {//+버튼을 누르면 컴퓨터에서 선택 버튼생성
            const selFromComBtn = document.createElement('button');
            selFromComBtn.type = 'button';
            selFromComBtn.className = 'btn btn-primary';
            selFromComBtn.innerText = '컴퓨터에서 선택';
            selFromComBtn.addEventListener('click', function() {
                frmElem.imgs.click();//클릭시 파일업로드기능 input type=file name=imgs클릭
            });
            body.innerHTML = null;//공간초기화
            body.appendChild(selFromComBtn);//버튼추가
        });
    }

    function moveToFeedWin(iuser) {
        location.href = `/user/feedwin?iuser=${iuser}`;
    }

    const feedObj = {
        limit: 20,
        itemLength: 0,
        currentPage: 1,
        swiper: null,
        loadingElem: document.querySelector('.loading'),
        containerElem: document.querySelector('#item_container'),

        getFeedList: function() {
            this.showLoading();            
            const param = {
                page: this.currentPage++
            }
            fetch('/feed/rest' + encodeQueryString(param))
            .then(res => res.json())
            .then(list => {
                console.log(list);
                this.makeFeedList(list);
            })
            .catch(e => {
                console.error(e);
                this.hideLoading();
            });
        },
        makeFeedList: function(list) {//item을 받아서 리스트(div)에추가
            if(list.length !== 0) {
                list.forEach(item => {
                    const divItem = this.makeFeedItem(item);
                    this.containerElem.appendChild(divItem);
                });
            }

            if(this.swiper !==null) { this.swiper = null; }
            this.swiper = new Swiper('.swiper', {
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                },
                pagination: { el: '.swiper-pagination' },
                allowTouchMove: false,
                direction: 'horizontal',
                loop: false
            });

            this.hideLoading();
        },
        makeFeedItem: function(item) {//item을 만들어서 return
            console.log(item);
            //리스트부모
            const divContainer = document.createElement("div");
            divContainer.className = 'item mt-3 mb-3 list';

            //리스트헤더
            const divTop = document.createElement('div');
            divContainer.appendChild(divTop);
            const regDtInfo = getDateTimeInfo(item.regdt);
            divTop.className = 'd-flex flex-row ps-3 pe-3';
            const writerImg = `<img src='/static/img/profile/${item.iuser}/${item.mainimg}' 
                onerror='this.error=null;this.src="/static/img/profile/defaultProfileimg.png"'>`;
            divTop.innerHTML = `
                <div class="d-flex flex-column justify-content-center">
                    <div class="circleimg h40 w40 pointer feedWin">${writerImg}</div>
                </div>
                <div class="p-3 flex-grow-1">
                    <div><span class="pointer feedWin">${item.writer}</span> - ${regDtInfo}</div>
                    <div>${item.location === null ? '' : item.location}</div>
                </div>   
            `;

            const feedwinList = divTop.querySelectorAll('.feedWin');
            feedwinList.forEach(el => {
                el.addEventListener('click', () => {
                    moveToFeedWin(item.iuser);
                });
            });
            
            // 이미지리스트
            const divImgSwiper = document.createElement('div');
            divContainer.appendChild(divImgSwiper);
            divImgSwiper.className = 'swiper item_img';
            divImgSwiper.innerHTML = `
                <div class="swiper-wrapper align-items-center"></div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            `;
            const divSwiperWrapper = divImgSwiper.querySelector('.swiper-wrapper');
            
            item.imgList.forEach(function(imgObj) {
                const divSwiperSlide = document.createElement('div');
                divSwiperWrapper.appendChild(divSwiperSlide);
                divSwiperSlide.classList.add('swiper-slide');
                
                const img = document.createElement('img');
                divSwiperSlide.appendChild(img);
                img.className = 'w100p_mw614 pointer';
                img.src = `/static/img/feed/${item.ifeed}/${imgObj.img}`;
                img.addEventListener('click', function() {
                    const imgbox = document.createElement('div');
                    imgbox.className = "modal-img pointer d-flex justify-content-center align-items-center";
                    imgbox.innerHTML = `
                        <div class="modal-dialog">
                            <img class="w300" src=${img.src}>
                        </div>`
                        imgbox.addEventListener("click",()=>{
                            imgbox.remove();
                        })
                    const main = document.querySelector('main');
                    main.appendChild(imgbox);
                })
                });

            //좋아요아이콘, dm 담을 상자
            const divBtns = document.createElement('div');
            divContainer.appendChild(divBtns);
            divBtns.className = 'favCont p-2 d-flex flex-row';

            //좋아요 아이콘
            const heartIcon = document.createElement('i');
            divBtns.appendChild(heartIcon);
            heartIcon.className = 'fa-solid fa-heart pointer rem1_5 me-3';
            heartIcon.classList.add(item.isFav === 1 ? 'fas' : 'far');
            heartIcon.addEventListener('click', e => {
                let method = 'POST';
                if(item.isFav === 1) { //delete (1은 0으로 바꿔줘야 함)
                    method = 'DELETE';
                }

                fetch(`/feed/fav/${item.ifeed}` , {
                    'method' : method,
                }).then(res => res.json())
                .then(res => {
                    if(res.result) {
                        item.isFav = 1 - item.isFav;// 0>1, 1>0
                        if(item.isFav === 0) { // 좋아요 취소
                            heartIcon.classList.remove('fas');
                            heartIcon.classList.add('far');
                        } else { // 좋아요 처리
                            heartIcon.classList.remove('far');
                            heartIcon.classList.add('fas');
                        }
                    } else {
                        alert('좋아요를 할 수 없습니다.');
                    }
                });
            });

            //dm
            const divDm = document.createElement('div');
            divBtns.appendChild(divDm);
            divDm.className = "pointer";
            divDm.innerHTML = `<svg aria-label="다이렉트 메시지" class="_8-yf5 " color="#262626" fill="#262626" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></polygon></svg>`;

            //좋아요 갯수
            const divFav = document.createElement('div');
            divContainer.appendChild(divFav);
            divFav.className = 'p2 d-none';
            const spanFavCnt = document.createElement('span');
            divFav.appendChild(spanFavCnt);
            spanFavCnt.className = 'bold ps-1';
            spanFavCnt.innerHTML = `좋아요 ${item.favCnt}개`;
            if(item.favCnt > 0) { divFav.classList.remove('d-none'); }

            //내용
            if(item.ctnt != null && item.ctnt !== '') {
                const divCtnt = document.createElement('div');
                divContainer.appendChild(divCtnt);
                divCtnt.innerText = item.ctnt;
                divCtnt.className = 'itemCtnt p-3';
            }

            //댓글
            const divCmtList = document.createElement('div');
            divContainer.appendChild(divCmtList);

            const divCmt = document.createElement('div');
            divContainer.appendChild(divCmt);
            const divCmtForm = document.createElement('div');
            divCmt.className = 'd-flex flex-row';
            divCmt.appendChild(divCmtForm);

            divCmtForm.innerHTML =  `
                <input type="text" class="flex-glow-1 my_input back_color p-2" placeholder="댓글을 입력하세요...">
                <button type="button" class="btn btn-outline-primary">등록</button>
            `;

            return divContainer;
        },

        showLoading: function() { this.loadingElem.classList.remove('d-none'); },
        hideLoading: function() { this.loadingElem.classList.add('d-none'); }

    }
    feedObj.getFeedList();



})();