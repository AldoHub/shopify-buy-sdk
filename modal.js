    let client;
    let redirectTo = null;
    let modalWrapper = document.querySelector('.products-modal-wrapper');
    let modal = document.querySelector('.products-modal');
    let modalContent = document.querySelector('.products');

    //init the buy sdk
    __initSDK();

    //grab the anchors
    let _triggers = document.querySelectorAll(".sdk-trigger");
    let triggers = Array.from(_triggers);
    //btn
    let closeBtn = document.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      modalWrapper.classList.remove('show');
      location.replace(redirectTo);
    });


    //add the events to the anchors
    triggers.map((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();

        //we need the hrefs
        let target = e.target;
        let href = target.getAttribute('href');
        redirectTo = href;
        //show the modal
        modalWrapper.classList.add('show');

      });
    });

    //event that closes the modal on wrapper click
    modalWrapper.addEventListener('click', () => {
      modalWrapper.classList.remove("show");
    });   
   
    //stop event propagation on the modal content itself
    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });



    //--- inits the sdk and loads/sets the products
    async function __initSDK(){
      client = ShopifyBuy.buildClient({
        domain: 'store.test.com',
        storefrontAccessToken: 'YOUR_API_KEY'
      });
      if(client){
        let products = await fetchProducts();
        //build the html for the products
        renderProductsHTML(products);    
      }else{
        alert("SDK Error!!");
      }
    }

    //--- passes the handles to the fetch function and returns an array with such items
    async function fetchProducts(){
      let productsHandles = ['product-1', 'product-2']; //product handles should reference real products

      let products = await Promise.all(
          productsHandles.map(async(handle) => {
          let product = await fetchProductByHandle(handle);
          return product;
        })
      );
      
      return products;
    }

    //--- returns the product
    async function fetchProductByHandle(handle){
      //use the sdks fetchbyhandle function
      let response = await client.product.fetchByHandle(handle).catch((err) => console.log(err));
      //get the product properties
      let product = {...response};
      return product;
    }


    //--- builds the html for the products to be injected
    function renderProductsHTML(products){  
      products.map((product) => {
        renderProduct(product);
      });
    }


    //--- aux function for renderProductsHTMLhtml - creates the wrappers
    function renderProduct(product){
        let wrapper = document.createElement('div');
        wrapper.classList.add('product-item');
        modalContent.appendChild(wrapper);

        //use the created weapper to append the rest of the children
        renderThumbs(product, wrapper);

        //base the rest on first variant
        let firstVariant = {...product.variants[0]}
        //add to cart button
        renderBtn(firstVariant, wrapper, product.handle);

        renderTitles(product, wrapper);

        //render buttons according the variants in the product
        if(product.variants.length > 1){
          //reners the select if there are more than 1 variant
          let select = renderSelectOptions(wrapper, product.handle);
          variants = product.variants.map((variant) => {
            rendervariantOptions({...variant}, select);
          });
        }
      
        //price button
        renderPrice(firstVariant, wrapper, product.handle);

    }

    //--- aux function for renderProductsHTMLhtml - creates the thumbnails
    function renderThumbs(product, wrapper){
        let thumbnail = document.createElement('img');
        let t = {...product.images[0]}
        thumbnail.setAttribute('src', t.src);
        thumbnail.classList.add('product-thumbnail');
        wrapper.appendChild(thumbnail);
    }

    //--- aux function for renderProductsHTMLhtml - creates the select input
    function renderSelectOptions(wrapper, handle){
      let select = document.createElement('select');
      select.setAttribute("name", "variants");
      wrapper.appendChild(select);

      select.addEventListener('change', (e) => {
        //on change, set the id attribute for the variant on the add to cart btn
      
        let selectedVariant = e.target.value;
        //get the selected option and grab the price attribute from it
        let priceAttr = e.target.options[e.target.selectedIndex].getAttribute('data-variant-price');
        
        let btn = document.querySelector(`#${handle}`);
        let price = document.querySelector(`#price-${handle}`);
        
        btn.setAttribute('data-variant-id', selectedVariant);
        price.innerHTML = '$'+ priceAttr;
     
      });

      return select;
    }

    //--- aux function for renderProductsHTMLhtml - creates the select options
    function rendervariantOptions(variant, select){
      let option = document.createElement('option');
      let optionText = document.createTextNode(variant.title)

      let variantPrice = {...variant.price};
      
      option.setAttribute('value', variant.id);
      option.setAttribute('data-variant-price', variantPrice.amount);
      option.appendChild(optionText);
      select.appendChild(option);


    }

    //--- aux function for renderProductsHTMLhtml - creates the buttons
    function renderBtn(variant, wrapper, handle){
      //we need the first variant and set that as default
        let variantId = variant.id;
        
        let btn = document.createElement('button');
        let label = document.createTextNode('Add To Cart');
        btn.setAttribute('type', 'button');
        btn.setAttribute('data-variant-id', variantId);
      
        btn.setAttribute('id', handle);

        btn.classList.add('add-to-cart-btn');
        btn.appendChild(label);
        wrapper.appendChild(btn);

     
        //add listener to the buttons
        btn.addEventListener('click', async(e) => {
          console.log(e.target)
          let variantId = e.target.getAttribute('data-variant-id');
        
          //Create a checkout
          let checkout = await client.checkout.create();

          if(checkout){
            //get the checkout id
            let {id} = {...checkout}
          
            //add items to the checkout
            let lineItemsToAdd = [
              {
                variantId: variantId,
                quantity: 1,
              }
            ];

            //Add an item to the checkout
            client.checkout.addLineItems(id, lineItemsToAdd).then((checkout) => {
              //redirect to the checkout
              location.href = checkout.webUrl; 
            });
            
          }

        });
       
    }

    //--- aux function for renderProductsHTMLhtml - creates the titles
    function renderTitles(product, wrapper){
        let title = document.createElement('h6');
        let titleText = document.createTextNode(product.title); 
        title.appendChild(titleText);
        wrapper.appendChild(title);
    }

    //--- aux function for renderProductsHTMLhtml - creates the price
    function renderPrice(variant, wrapper, handle){
      let variantPrice = {...variant.price}
      let price = document.createElement('p');
      let parsedPrice = parseFloat(variantPrice.amount).toFixed(2);
      let priceText = document.createTextNode(`$${parsedPrice}`);
      price.setAttribute('id', `price-${handle}`);
      price.classList.add('price-text');
      price.appendChild(priceText);
      wrapper.appendChild(price);
    }