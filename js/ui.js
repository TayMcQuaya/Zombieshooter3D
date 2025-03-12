// ui.js - User interface handling

// UI elements
let scoreElement;
let zombieKillsElement; // New element for zombie kills
let waveElement;
let weaponElement; // New element for displaying current weapon
let hearts = [];
const MAX_HEALTH = 3;
let currentHealth = MAX_HEALTH;

// Initialize UI
function initUI() {
    // First, remove any existing UI elements to prevent duplicates
    cleanupUI();
    
    // Create main UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'game-ui-container';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '100%';
    uiContainer.style.height = '100%';
    uiContainer.style.pointerEvents = 'none';
    uiContainer.style.zIndex = '10'; // Reduced from 100 to be below start menu (which is 20)
    document.body.appendChild(uiContainer);
    
    // Create hearts container (top left)
    const heartsContainer = document.createElement('div');
    heartsContainer.id = 'hearts-container';
    heartsContainer.style.position = 'absolute';
    heartsContainer.style.top = '20px';
    heartsContainer.style.left = '20px';
    heartsContainer.style.display = 'flex';
    heartsContainer.style.gap = '15px';  // Increased gap for bigger hearts
    uiContainer.appendChild(heartsContainer);
    
    // Create hearts
    hearts = []; // Clear existing hearts
    for (let i = 0; i < MAX_HEALTH; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.fontSize = '60px';  // Increased from 48px to 60px
        heart.style.textShadow = '0 0 5px black, 0 0 5px black'; // Double shadow for better visibility
        heartsContainer.appendChild(heart);
        hearts.push(heart);
    }
    
    // Create wave display (below hearts)
    const waveContainer = document.createElement('div');
    waveContainer.id = 'wave-container';
    waveContainer.style.position = 'absolute';
    waveContainer.style.top = '105px';  // Adjusted to account for larger hearts
    waveContainer.style.left = '20px';
    waveContainer.style.color = '#ff3333';  // Changed to match theme
    waveContainer.style.textShadow = '0 0 10px #800000';  // Changed to match theme
    waveContainer.style.fontSize = '42px';  // Increased from 32px to 42px
    waveContainer.style.fontWeight = 'bold';
    waveContainer.style.fontFamily = "'Creepster', cursive";  // Added themed font
    
    // Create wave text and number separately to style them
    const waveText = document.createElement('span');
    waveText.textContent = 'Wave: ';
    waveText.style.fontFamily = "'Creepster', cursive";
    waveText.style.color = '#ff3333';
    waveText.style.textShadow = '0 0 10px #800000';
    waveText.style.letterSpacing = '2px';
    
    const waveNumber = document.createElement('span');
    waveNumber.id = 'wave';
    waveNumber.textContent = '1';
    waveNumber.style.fontSize = '42px'; // Match the container font size
    waveNumber.style.fontFamily = "'Creepster', cursive";
    waveNumber.style.color = '#ff3333';
    waveNumber.style.textShadow = '0 0 10px #800000';
    
    waveContainer.appendChild(waveText);
    waveContainer.appendChild(waveNumber);
    uiContainer.appendChild(waveContainer);
    
    // Create weapon display (below wave display)
    const weaponContainer = document.createElement('div');
    weaponContainer.id = 'weapon-container';
    weaponContainer.style.position = 'absolute';
    weaponContainer.style.top = '165px';  // Adjusted for larger wave text
    weaponContainer.style.left = '20px';
    weaponContainer.style.color = '#ff3333';  // Changed back to red theme color
    weaponContainer.style.textShadow = '0 0 10px #800000';  // Changed back to red theme shadow
    weaponContainer.style.fontSize = '38px';  // Keeping the larger font size
    weaponContainer.style.fontWeight = 'bold';
    weaponContainer.style.fontFamily = "'Creepster', cursive";  // Themed font
    
    // Create custom weapon icon instead of emoji
    const weaponIcon = document.createElement('span');
    weaponIcon.style.display = 'inline-block';
    weaponIcon.style.marginRight = '12px';
    weaponIcon.style.verticalAlign = 'middle';
    weaponIcon.style.width = '60px';
    weaponIcon.style.height = '60px';
    weaponIcon.style.position = 'relative';
    weaponIcon.style.top = '-5px';
    
    // Directly insert the SVG content from gun.svg
    weaponIcon.innerHTML = `<svg height="60" width="60" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="m7.375 10.125h-1.625l-1.375 1.75h3z" fill="#3e3a39"/><path d="m8.125 12.625h-5.2929687l2.5532227-3.25h2.739746zm-2.2070312-1.5h.7070312v-.25h-.5102539z"/><path d="m61.0087891 13.6479492-8.9042969-.2021484 4.7558594-3.1708984 3.0566406-.3398438zm-4.1132813-1.59375 2.0957031.0478516-.1582031-.5371094-1.4433594.1601563z"/><path d="m25.9375 12.3125h9.5l.1875 7.0625h-8.625z" fill="#f5f5f5"/><path d="m36.1386719 19.875h-9.5688477l-1.2133789-8.0625h10.5683594zm-8.7084961-1h7.6811523l-.1611328-6.0625h-8.4316406z"/><path d="m29.5 23.875.75 3.875s-.25 2.75-3.25 2.5l.625.625s3.625.625 4.875-3.375c0 0 4.375-.25 5.125-2.125 0 0 .625-5.5-8.125-1.5z" fill="#3e3a39"/><path d="m28.1606445 31.6606445c-.4086914 0-.6630859-.0463867-.6630859-.0463867l-.2304688-.0419922-.7973633-.7919922.5927734-1.277832c1.9570313.1669922 2.3623047-1.3320313 2.4282227-1.7290039l-.8393555-4.3354492.5366211-.2451172c4.1293945-1.8867188 6.9477539-2 8.355957-.4233398.9921875 1.1113281.8339844 2.6259766.8261719 2.6899414l-.0488281.1938477c-.7568359 1.8935547-3.9726563 2.4174805-5.2734375 2.5532227-1.2026367 3.1059569-3.7910156 3.4541014-4.887207 3.4541014zm2.1889649-7.3422851.6567383 3.3935547-.0092773.105957c-.0390625.4291992-.1967773 1.0063477-.5283203 1.5527344.5258789-.4335938 1.0029297-1.0942383 1.3154297-2.0942383l.1547852-.4946289.5175781-.0302734c1.5678711-.0917969 3.9213867-.6342773 4.4282227-1.5615234.0039063-.2553711-.0283203-.9448242-.4667969-1.4287109-.857422-.9472658-3.0312501-.7519533-6.0683595.5571288z"/><path d="m58 13.625h-20.25l1.875 3.375h-17.25l.625-3.875h-18.625l-2.125 5.625.875 2.375c-.25.75.5 2.875.5 2.875h13.75c1.75.25 2.25 3 2.125 4.875s1.5 5.25 1.5 5.25h14.375c2.25-1 5 .375 5.375.875s0 3.25.25 3.625 2.5 1.875 2.25 3.25.25 2.875.625 3.75 2.25 2.125 1 3.625-1.25 2.375-1.25 2.375l3.125.5 11.125-1.125 1.25.875c3-2.75 1.25-12.75.375-13.875s-2.125-4-4.25-8 2.25-7.125 2.25-7.125l3.625-.125 1.5-1.125v-5.625zm-21.625 17.75c-1.25.875-2.375.875-2.375.875h-10.375c-2.375-.25-2.125-4.375-2-5.5s2.875-2.625 2.875-2.625 11.375-.375 12.5.375.625 6-.625 6.875z" fill="#3e3a39"/><path d="m46.7285156 52.8808594-3.8535156-.616211v-.6396484c0-.1914063.0683594-1.2285156 1.4238281-2.8554688.4550781-.5449219.2880859-.9345703-.4814453-1.9042969-.2529297-.3183594-.4921875-.6201172-.6318359-.9443359-.4589844-1.0722656-.9482422-2.6669922-.6738281-4.1796875.1152344-.6347656-1.0556641-1.6728516-1.5556641-2.1162109-.2910156-.2587891-.4667969-.5800781-.5800781-.5839844-.2333984-.3505859-.2324219-.8535156-.2089844-1.9589844.0107422-.5126953.03125-1.4648438-.0576172-1.6992188-.1533203-.1376953-1.4980469-.8632813-2.9628906-.8632813-.5390625 0-1.0322266.0976563-1.4667969.2910156l-.1455078.0644533h-15.0053711l-.2045898-.4248047c-.175293-.3632813-1.7070313-3.6108398-1.5727539-5.625.121582-1.8183594-.394043-3.8710938-1.4379883-4.0751953h-14.2192383l-.1762695-.5004883c-.2260742-.6396484-.6948242-2.1206055-.5703125-3.0649414l-.8979493-2.4379883 2.4067383-6.371582h20.0244141l-.625 3.875h15.0947266l-1.875-3.375h21.7060547l5.1933593 2.6669922v6.4580078l-1.9882813 1.4912109-3.6210938.125c-.734375.5908203-3.4404297 3.0449219-1.8535156 6.0317383.8154298 1.5341797 1.5019532 2.9028321 2.0878907 4.0717774.8925781 1.7783203 1.5966797 3.1826172 2.0917969 3.8193359 1.0849609 1.3955078 2.8710938 11.8349609-.4599609 14.8886719l-.4433594.4072266-1.515625-1.0605469zm-2.1376953-1.8613281 2.1806641.3496094 11.3056641-1.1435547.9267578.6484375c2.0136719-2.9121094.6279297-11.4199219-.0966797-12.4150391-.5849609-.7519531-1.2822266-2.1425781-2.2480469-4.0664063-.5820313-1.1601563-1.2626953-2.5185547-2.0712891-4.0405273-1.9248047-3.6230469.7783203-6.8745117 2.4765625-8.0874023l.1835938-.1313477 3.6152344-.1245117 1.0117187-.7587891v-4.7919922l-4.0566406-2.0830078h-18.7939453l1.875 3.375h-19.4052735l.625-3.875h-17.2255859l-1.8432617 4.878418.8696289 2.359375-.0834961.2495117c-.0678711.2319336.0834961 1.0581055.3330078 1.8876953l13.3115234.0073242c2.140625.3061523 2.9350586 3.1523438 2.7675781 5.6674805-.0800781 1.1958008.7373047 3.3305664 1.2324219 4.4501953h13.7426758c.5869141-.2363281 1.2333984-.3554688 1.9228516-.3554688 1.8652344 0 3.7353516.90625 4.203125 1.5302734.3447266.4589844.3447266 1.2734375.3173828 2.5644531-.0078125.3701172-.0195313.9072266.0048828 1.1416016.0625.0566406.1630859.1435547.2792969.2460938.8613281.7636719 2.3027344 2.0419922 2.0371094 3.5068359-.2197266 1.2070313.2666016 2.5986328.5761719 3.3203125.0595703.140625.2470703.3759766.4277344.6044922.6181641.7783203 1.7675781 2.2265625.4589844 3.796875-.4453126.5341797-.7070314.9687501-.8603517 1.2890626zm-10.5908203-18.0195313h-10.375c-.7744141-.0771484-1.3779297-.4091797-1.824707-.9643555-1.2368164-1.5371094-1.0175781-4.4975586-.9208984-5.3686523.15625-1.4042969 2.5356445-2.8046875 3.2612305-3.2001953l.1567383-.0854492.1777344-.0058594c.0288086-.0009766 2.890625-.0942383 5.8530273-.0942383 6.1962891 0 6.7763672.3867188 7.0878906.5947266.6201172.4135742.9433594 1.3818359.9599609 2.878418.0185547 1.6494141-.3837891 4.4042969-1.5712891 5.2348633-1.4267578.9990234-2.7490234 1.0107421-2.8046875 1.0107421zm-9.2944336-8.1308594c-1.1811523.671875-2.2944336 1.6020508-2.3349609 1.9638672-.1586914 1.4262695-.097168 3.3979492.5986328 4.262207.1987305.2470703.4321289.3769531.734375.4086914l10.2963867-.0039062c.0029297 0 .9238281-.0249023 1.9453125-.7392578.2871094-.2016602.7587891-1.3769531.8964844-3.0600586.1318359-1.6088867-.1308594-2.4501953-.2714844-2.5869141-.0859375-.0356445-.9638672-.3325195-6.2421875-.3325195-2.512207 0-4.9506836.0673828-5.6225586.0878906z"/><path d="m2.125 19.375h60.75v-3.75l-2.375-3.5h-25l-.3125 2.1875h-8.75l-.6875-2.4375h-22.75z" fill="#595757"/><path d="m58.0166016 50.8427734-15.1416016 1.421875.1650391 2.0683594.1025391.1435547c.7392577 1.0390625 2.508789 1.5234375 5.5703124 1.5234375 1.6972656 0 9.3388672-1.2978516 9.6630859-1.3535156l.8623048-.1464844z"/><path d="m3.375 22h16.125" fill="#3e3a39"/><path d="m3.375 21.5h16.125v1h-16.125z"/><path d="m39.167179 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 30.504774 -26.095066)"/><path d="m51.56757 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 35.437649 -35.994862)"/><path d="m48.466984 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 34.204235 -33.519524)"/><path d="m45.367374 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 32.97121 -31.044964)"/><path d="m42.266789 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 31.737799 -28.569626)"/><path d="m54.667179 16.562204h4.540642v2.000592h-4.540642z" transform="matrix(.6022 .7983452 -.7983452 .6022 36.670673 -38.469418)"/><path d="m29.625 20.5h3.75v2.125h-3.75z" fill="#3e3a39"/><path d="m33.875 23.125h-4.75v-3.125h4.75zm-3.75-1h2.75v-1.125h-2.75z"/><path d="m38.875 23.625 15-.5s-5.375 6.375-12.375 8.25z" fill="#717071"/><path d="m42.625317 32.697636h.999367v4.229731h-.999367z" transform="matrix(.3244243 .9459116 -.9459116 .3244243 62.063751 -17.27396)"/><path d="m43.500317 35.302364h.999367v5.020271h-.999367z" transform="matrix(.3244243 .9459116 -.9459116 .3244243 65.492615 -16.074905)"/><path d="m43.2519531 41.7460938-.2539062-.9667969 4.4082031-1.2978516.2539063.9667969z"/><path d="m43.7832031 45.2246094-.3164062-.9492188 4.243164-1.1103515.3164063.9492187z"/><path d="m47.4658203 50.8144531-.6455078-3.7109375 11.0957031-5.890625.8847656 7.9628906zm.4638672-3.1679687.3544922 2.0390625 9.4150391-1.3613281-.6152344-5.5371094z"/><path d="m16.375 19.625 1.625 4.25h7.875" fill="#070505"/><path d="m25.875 24.375h-8.2192383l-1.7475586-4.5712891.9335938-.3574218 1.5024414 3.9287109h7.5307617z"/><path d="m42 19.625h10.875v1.875h-10.875z"/><path d="m53.625 22.25h-12.375v-3.375h12.375zm-10.875-1.5h9.375v-.375h-9.375z"/><path d="m16.625 15.125h44.625v1h-44.625z" fill="#9c9c9d"/><path d="m15.8793945 17.875h-13.2543945v-1h12.9956055l.6171875-.3427734-1.6972657-3.9604493.9189454-.3935546 2.0527343 4.7895507z" fill="#3e3a39"/><path d="m63.625 20.125h-62.3427734l1.050293-9h23.9853516l.6875 2.4375h7.5317383l.3125-2.1875h26.0478516l2.7275389 4.0195313zm-60.6572266-1.5h59.1572266v-2.7695313l-2.0224609-2.9804687h-23.9521485l-.3125 2.1875h-9.9682617l-.6875-2.4375h-21.5146484z"/></svg>`;
    
    // Add a filter for better visibility
    const svgElement = weaponIcon.querySelector('svg');
    if (svgElement) {
        // Add a defs element if it doesn't exist
        let defs = svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            svgElement.prepend(defs);
        }
        
        // Add a drop shadow filter
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "outline");
        filter.innerHTML = '<feDropShadow dx="0" dy="0" stdDeviation="0.5" flood-color="#000000" flood-opacity="0.7"/>';
        defs.appendChild(filter);
        
        // Apply the filter to the root element
        svgElement.setAttribute('filter', 'url(#outline)');
    }
    
    // Add the weapon icon to the container
    weaponContainer.appendChild(weaponIcon);
    
    // Create weapon name container
    const weaponNameContainer = document.createElement('span');
    weaponNameContainer.id = 'weapon-name';
    weaponNameContainer.textContent = 'Pistol';  // Default weapon
    weaponNameContainer.style.fontFamily = "'Creepster', cursive";
    weaponNameContainer.style.color = '#ff3333';  // Changed back to red theme color
    weaponNameContainer.style.textShadow = '0 0 10px #800000';  // Changed back to red theme shadow
    
    // Add small bullet indicator for ammo
    const bulletIndicator = document.createElement('span');
    bulletIndicator.style.marginLeft = '10px';
    bulletIndicator.textContent = '∞';  // Infinity symbol for unlimited ammo
    bulletIndicator.style.fontSize = '32px';  // Increased from 24px to 32px
    bulletIndicator.style.opacity = '0.85';
    
    weaponContainer.appendChild(weaponNameContainer);
    weaponContainer.appendChild(bulletIndicator);
    uiContainer.appendChild(weaponContainer);
    
    // Create score display (top right)
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-container';
    scoreContainer.style.position = 'absolute';
    scoreContainer.style.top = '20px';
    scoreContainer.style.right = '20px';
    scoreContainer.style.color = '#ff3333';  // Changed to match theme
    scoreContainer.style.textShadow = '0 0 10px #800000';  // Changed to match theme
    scoreContainer.style.fontSize = '42px';  // Increased from 32px to 42px
    scoreContainer.style.fontWeight = 'bold';
    scoreContainer.style.fontFamily = "'Creepster', cursive";  // Added themed font
    
    // Create score text and number separately to style them
    const scoreText = document.createElement('span');
    scoreText.textContent = 'Score: ';
    scoreText.style.fontFamily = "'Creepster', cursive";
    scoreText.style.color = '#ff3333';
    scoreText.style.textShadow = '0 0 10px #800000';
    
    const scoreNumber = document.createElement('span');
    scoreNumber.id = 'score';
    scoreNumber.textContent = '0';
    scoreNumber.style.fontSize = '42px'; // Match the container font size
    scoreNumber.style.fontFamily = "'Creepster', cursive";
    scoreNumber.style.color = '#ff3333';
    scoreNumber.style.textShadow = '0 0 10px #800000';
    
    scoreContainer.appendChild(scoreText);
    scoreContainer.appendChild(scoreNumber);
    uiContainer.appendChild(scoreContainer);
    
    // Create zombie kills display (below score)
    const zombieKillsContainer = document.createElement('div');
    zombieKillsContainer.id = 'zombie-kills-container';
    zombieKillsContainer.style.position = 'absolute';
    zombieKillsContainer.style.top = '80px';  // Adjusted for larger score text
    zombieKillsContainer.style.right = '20px';
    zombieKillsContainer.style.color = '#ff3333';
    zombieKillsContainer.style.textShadow = '0 0 10px #800000';
    zombieKillsContainer.style.fontSize = '42px';  // Increased from 32px to 42px
    zombieKillsContainer.style.fontWeight = 'bold';
    zombieKillsContainer.style.fontFamily = "'Creepster', cursive";
    
    // Create zombie kills text and number separately to style them
    const zombieKillsText = document.createElement('span');
    zombieKillsText.textContent = 'Zombies Killed: ';
    zombieKillsText.style.fontFamily = "'Creepster', cursive";
    zombieKillsText.style.color = '#ff3333';
    zombieKillsText.style.textShadow = '0 0 10px #800000';
    
    const zombieKillsNumber = document.createElement('span');
    zombieKillsNumber.id = 'zombie-kills';
    zombieKillsNumber.textContent = '0';
    zombieKillsNumber.style.fontSize = '42px'; // Match the container font size
    zombieKillsNumber.style.fontFamily = "'Creepster', cursive";
    zombieKillsNumber.style.color = '#ff3333';
    zombieKillsNumber.style.textShadow = '0 0 10px #800000';
    
    zombieKillsContainer.appendChild(zombieKillsText);
    zombieKillsContainer.appendChild(zombieKillsNumber);
    uiContainer.appendChild(zombieKillsContainer);
    
    // Get references to elements we need to update
    scoreElement = document.getElementById('score');
    zombieKillsElement = document.getElementById('zombie-kills');
    waveElement = document.getElementById('wave');
    weaponElement = document.getElementById('weapon-name');
    
    // Create stamina bar (top middle)
    const staminaContainer = document.createElement('div');
    staminaContainer.id = 'stamina-container';
    staminaContainer.style.position = 'absolute';
    staminaContainer.style.top = '20px';
    staminaContainer.style.left = '50%';
    staminaContainer.style.transform = 'translateX(-50%)';
    staminaContainer.style.width = '350px';  // Increased from 300px to 350px
    staminaContainer.style.display = 'flex';
    staminaContainer.style.flexDirection = 'column';
    staminaContainer.style.alignItems = 'center';
    staminaContainer.style.gap = '5px';
    uiContainer.appendChild(staminaContainer);
    
    // Stamina label
    const staminaLabel = document.createElement('div');
    staminaLabel.id = 'stamina-label';
    staminaLabel.style.color = '#ff3333';
    staminaLabel.style.textShadow = '0 0 10px #800000';
    staminaLabel.style.fontSize = '32px';  // Increased from 24px to 32px
    staminaLabel.style.fontWeight = 'bold';
    staminaLabel.style.fontFamily = "'Creepster', cursive";
    staminaLabel.textContent = 'STAMINA';
    staminaContainer.appendChild(staminaLabel);
    
    // Stamina bar background
    const staminaBar = document.createElement('div');
    staminaBar.id = 'stamina-bar';
    staminaBar.style.width = '100%';
    staminaBar.style.height = '25px';  // Increased from 20px to 25px
    staminaBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    staminaBar.style.border = '2px solid #990000';
    staminaBar.style.boxShadow = '0 0 10px #ff0000';
    staminaBar.style.borderRadius = '10px';
    staminaBar.style.overflow = 'hidden';
    staminaContainer.appendChild(staminaBar);
    
    // Stamina fill
    const staminaFill = document.createElement('div');
    staminaFill.id = 'stamina-fill';
    staminaFill.style.width = '100%';
    staminaFill.style.height = '100%';
    staminaFill.style.backgroundColor = '#ff3333';
    staminaFill.style.boxShadow = '0 0 10px #ff0000';
    staminaFill.style.transition = 'width 0.3s ease';
    staminaBar.appendChild(staminaFill);
    
    // Initialize UI values
    updateHealth();
    updateUI();
    
    console.log("UI initialized with clean layout");
}

// Clean up existing UI elements
function cleanupUI() {
    // Remove existing UI elements by ID
    const elementsToRemove = [
        'game-ui-container',
        'hearts-container', 
        'wave-container', 
        'score-container',
        'zombie-kills-container',
        'health-container',
        'health-label',
        'health-bar',
        'stamina-container',
        'stamina-label',
        'stamina-bar',
        'weapon-container' // Added weapon container to cleanup list
    ];
    
    elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.parentNode.removeChild(element);
        }
    });
    
    // Also remove any elements with these classes
    const classesToRemove = ['health-heart'];
    
    classesToRemove.forEach(className => {
        const elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    });
}

// Helper function to clean up duplicate UI elements
function cleanupDuplicateUI() {
    // This function is now replaced by the more comprehensive cleanupUI
    cleanupUI();
}

// Update UI with current game state
function updateUI() {
    // Update score
    if (scoreElement) {
        scoreElement.textContent = score;
        
        // Ensure score element has bloody styling
        scoreElement.style.fontFamily = "'Creepster', cursive";
        scoreElement.style.color = '#ff3333';
        scoreElement.style.textShadow = '0 0 10px #800000';
    }
    
    // Update zombie kills
    if (zombieKillsElement) {
        zombieKillsElement.textContent = zombieKills;
        
        // Ensure zombie kills element has bloody styling
        zombieKillsElement.style.fontFamily = "'Creepster', cursive";
        zombieKillsElement.style.color = '#ff3333';
        zombieKillsElement.style.textShadow = '0 0 10px #800000';
    }
    
    // Update health display
    updateHealth();
}

// Update health display
function updateHealth() {
    hearts.forEach((heart, index) => {
        if (index < currentHealth) {
            heart.innerHTML = '❤️'; // Full heart
        } else {
            heart.innerHTML = '🖤'; // Empty heart
        }
    });
    
    // Check for game over
    if (currentHealth <= 0) {
        gameOver();
    }
}

// Damage player
function damagePlayer() {
    if (currentHealth > 0) {
        currentHealth--;
        updateHealth();
        playDamageSound();
        showDamageEffect();
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
}

// Show damage effect
function showDamageEffect() {
    // Create red overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.4)'; // More visible red flash
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.15s ease-in-out';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);
    
    // Animate the flash
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 150);
        }, 150);
    });
    
    // Screen shake effect
    const gameContainer = document.querySelector('canvas');
    if (gameContainer) {
        gameContainer.style.transition = 'transform 0.1s ease-in-out';
        gameContainer.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        
        setTimeout(() => {
            gameContainer.style.transform = 'translate(0, 0)';
        }, 100);
    }
}

// Game over screen
function gameOver() {
    gameActive = false;
    document.exitPointerLock();
    
    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.background = 'linear-gradient(rgba(20, 0, 0, 0.92), rgba(0, 0, 0, 0.98)), url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" fill="rgba(255,0,0,0.15)" font-size="80">💀</text></svg>\')';
    gameOverScreen.style.backgroundSize = 'cover, 120px 120px';
    gameOverScreen.style.backgroundRepeat = 'no-repeat, repeat';
    gameOverScreen.style.zIndex = '1000';
    
    // Game over title
    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    title.style.fontSize = '120px';
    title.style.fontFamily = "'Creepster', cursive";
    title.style.color = '#ff0000';
    title.style.textShadow = '0 0 30px #ff0000, 0 0 50px #800000, 0 0 70px #400000';
    title.style.marginBottom = '40px';
    title.style.letterSpacing = '12px';
    title.style.transform = 'rotate(-3deg)';
    title.style.animation = 'bloodDrip 3s infinite';
    gameOverScreen.appendChild(title);
    
    // Score display
    const scoreDisplay = document.createElement('p');
    scoreDisplay.textContent = `Zombies Killed: ${zombieKills}`;
    scoreDisplay.style.fontSize = '42px';
    scoreDisplay.style.color = '#ff3333';
    scoreDisplay.style.textShadow = '0 0 20px #800000';
    scoreDisplay.style.marginBottom = '20px'; // Reduced from 50px to 20px to make room for score
    scoreDisplay.style.fontFamily = "'Creepster', cursive";
    scoreDisplay.style.letterSpacing = '3px';
    scoreDisplay.style.transform = 'rotate(-2deg)';
    gameOverScreen.appendChild(scoreDisplay);
    
    // Total score display
    const totalScoreDisplay = document.createElement('p');
    totalScoreDisplay.textContent = `Total Score: ${score}`;
    totalScoreDisplay.style.fontSize = '36px';
    totalScoreDisplay.style.color = '#ffcc00'; // Gold color to differentiate from zombie kills
    totalScoreDisplay.style.textShadow = '0 0 20px #806000';
    totalScoreDisplay.style.marginBottom = '50px';
    totalScoreDisplay.style.fontFamily = "'Creepster', cursive";
    totalScoreDisplay.style.letterSpacing = '3px';
    totalScoreDisplay.style.transform = 'rotate(-1deg)';
    gameOverScreen.appendChild(totalScoreDisplay);
    
    // Try again button
    const tryAgainButton = document.createElement('button');
    tryAgainButton.textContent = 'PLAY AGAIN';
    tryAgainButton.style.padding = '20px 40px';
    tryAgainButton.style.fontSize = '28px';
    tryAgainButton.style.backgroundColor = 'transparent';
    tryAgainButton.style.color = '#33ff33';
    tryAgainButton.style.border = '3px solid #33ff33';
    tryAgainButton.style.borderRadius = '8px';
    tryAgainButton.style.cursor = 'pointer';
    tryAgainButton.style.transition = 'all 0.3s ease';
    tryAgainButton.style.margin = '15px';
    tryAgainButton.style.width = '280px';
    tryAgainButton.style.fontFamily = "'Creepster', cursive";
    tryAgainButton.style.letterSpacing = '3px';
    tryAgainButton.style.textTransform = 'uppercase';
    tryAgainButton.style.boxShadow = '0 0 15px #006600';
    tryAgainButton.addEventListener('mouseover', () => {
        tryAgainButton.style.backgroundColor = '#006600';
        tryAgainButton.style.color = '#ffffff';
        tryAgainButton.style.boxShadow = '0 0 25px #00ff00';
        tryAgainButton.style.transform = 'scale(1.05)';
    });
    tryAgainButton.addEventListener('mouseout', () => {
        tryAgainButton.style.backgroundColor = 'transparent';
        tryAgainButton.style.color = '#33ff33';
        tryAgainButton.style.boxShadow = '0 0 15px #006600';
        tryAgainButton.style.transform = 'scale(1)';
    });
    tryAgainButton.addEventListener('click', () => {
        location.reload();
    });
    gameOverScreen.appendChild(tryAgainButton);
    
    // Share score button
    const shareButton = document.createElement('button');
    shareButton.textContent = 'SHARE SCORE';
    shareButton.style.padding = '20px 40px';
    shareButton.style.fontSize = '28px';
    shareButton.style.backgroundColor = 'transparent';
    shareButton.style.color = '#ff3333';
    shareButton.style.border = '3px solid #ff3333';
    shareButton.style.borderRadius = '8px';
    shareButton.style.cursor = 'pointer';
    shareButton.style.transition = 'all 0.3s ease';
    shareButton.style.margin = '15px';
    shareButton.style.width = '280px';
    shareButton.style.fontFamily = "'Creepster', cursive";
    shareButton.style.letterSpacing = '3px';
    shareButton.style.textTransform = 'uppercase';
    shareButton.style.boxShadow = '0 0 15px #800000';
    shareButton.addEventListener('mouseover', () => {
        shareButton.style.backgroundColor = '#800000';
        shareButton.style.color = '#ffffff';
        shareButton.style.boxShadow = '0 0 25px #ff0000';
        shareButton.style.transform = 'scale(1.05)';
    });
    shareButton.addEventListener('mouseout', () => {
        shareButton.style.backgroundColor = 'transparent';
        shareButton.style.color = '#ff3333';
        shareButton.style.boxShadow = '0 0 15px #800000';
        shareButton.style.transform = 'scale(1)';
    });
    shareButton.addEventListener('click', shareScore);
    gameOverScreen.appendChild(shareButton);
    
    // Add the bloodDrip animation if it doesn't exist
    if (!document.getElementById('game-over-animations')) {
        const style = document.createElement('style');
        style.id = 'game-over-animations';
        style.textContent = `
            @keyframes bloodDrip {
                0%, 100% {
                    text-shadow: 0 0 30px #ff0000, 0 0 50px #800000, 0 0 70px #400000;
                    transform: rotate(-3deg) translateY(0);
                }
                50% {
                    text-shadow: 0 0 40px #ff0000, 0 0 60px #800000, 0 0 80px #400000;
                    transform: rotate(-3deg) translateY(10px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(gameOverScreen);
}

// Share score
function shareScore() {
    const url = window.location.href.split('?')[0];
    const text = `I killed ${zombieKills} zombies with a score of ${score} in Zombie Survival! Can you beat my score? Try it: ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

// Update wave number in UI
function updateWaveUI(wave) {
    if (waveElement) {
        waveElement.textContent = wave;
        
        // Animate wave number change
        const originalSize = '42px';
        const enlargedSize = '50px';
        
        waveElement.style.fontSize = enlargedSize;
        waveElement.style.transition = 'font-size 0.3s ease';
        
        setTimeout(() => {
            waveElement.style.fontSize = originalSize;
        }, 300);
    }
    
    // Show wave notification
    showWaveNotification(wave);
}

// Show wave notification
function showWaveNotification(wave) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'wave-notification';
    notification.textContent = `WAVE ${wave}`;
    
    // Style notification
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.color = '#ff3333'; // Changed to match theme
    notification.style.textShadow = '0 0 20px #800000'; // Changed to match theme
    notification.style.fontSize = '92px'; // Increased from 72px to 92px
    notification.style.fontWeight = 'bold';
    notification.style.fontFamily = "'Creepster', cursive"; // Added themed font
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    notification.style.pointerEvents = 'none';
    notification.style.zIndex = '500'; // Reduced from 1000 to be below pause menu (which is 1000)
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2500);
}

// Show damage indicator when player is hit
function showDamageIndicator() {
    // Create damage overlay
    const overlay = document.createElement('div');
    overlay.className = 'damage-overlay';
    
    // Style overlay
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    overlay.style.zIndex = '1000';
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Animate overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 200);
    
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 400);
}

// Show kill indicator when player destroys an enemy
function showKillIndicator(points) {
    // Create kill indicator
    const indicator = document.createElement('div');
    indicator.className = 'kill-indicator';
    indicator.textContent = `+${points}`;
    
    // Style indicator
    indicator.style.position = 'absolute';
    indicator.style.top = '40%';
    indicator.style.left = '55%';
    indicator.style.color = 'yellow';
    indicator.style.textShadow = '0 0 10px yellow';
    indicator.style.fontSize = '36px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 0.5s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '1000'; // High z-index to appear above crosshair
    
    // Add to document
    document.body.appendChild(indicator);
    
    // Animate indicator
    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateY(-20px)';
    }, 10);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 500);
    
    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 1000);
}

// Show wave cleared bonus indicator
function showWaveClearedIndicator() {
    // Create wave cleared indicator
    const indicator = document.createElement('div');
    indicator.className = 'wave-cleared-indicator';
    indicator.textContent = 'WAVE CLEARED! +50';
    
    // Style indicator
    indicator.style.position = 'absolute';
    indicator.style.top = '30%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.color = 'gold';
    indicator.style.textShadow = '0 0 15px gold';
    indicator.style.fontSize = '40px';
    indicator.style.fontWeight = 'bold';
    indicator.style.opacity = '0';
    indicator.style.transition = 'all 1s ease';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '1000'; // High z-index to appear above crosshair
    
    // Add to document
    document.body.appendChild(indicator);
    
    // Animate indicator
    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translate(-50%, -50%) scale(1.2)';
    }, 10);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 2000);
    
    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 3000);
}

function createUIContainer() {
    const uiContainer = document.createElement('div');
    uiContainer.classList.add('ui-container');
    return uiContainer;
}

function createHeartsContainer() {
    const heartsContainer = document.createElement('div');
    heartsContainer.classList.add('hearts-container');
    return heartsContainer;
}

function createHeart() {
    const heart = document.createElement('span');
    heart.classList.add('heart');
    heart.textContent = '❤️';
    return heart;
}

function createWaveContainer() {
    const waveContainer = document.createElement('div');
    waveContainer.classList.add('wave-container');
    
    // Create wave text with bloody font styling
    waveContainer.style.fontFamily = "'Creepster', cursive";
    waveContainer.style.color = '#ff3333';
    waveContainer.style.textShadow = '0 0 10px #800000';
    waveContainer.style.letterSpacing = '2px';
    waveContainer.textContent = 'Wave: 1';
    
    return waveContainer;
}

function createScoreContainer() {
    const scoreContainer = document.createElement('div');
    scoreContainer.classList.add('score-container');
    scoreContainer.textContent = 'Score: 0';
    return scoreContainer;
}

function createDamageOverlay() {
    const overlay = document.createElement('div');
    overlay.classList.add('damage-overlay');
    return overlay;
}

function showDamageOverlay() {
    const overlay = document.querySelector('.damage-overlay');
    overlay.classList.add('show');
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 150);
}

function createGameContainer() {
    const container = document.createElement('div');
    container.classList.add('game-container');
    return container;
}

function shakeScreen() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    setTimeout(() => {
        gameContainer.style.transform = 'translate(0, 0)';
    }, 100);
}

function createGameOverScreen() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.classList.add('game-over-screen');
    // ... rest of the game over screen creation code ...
    return gameOverScreen;
}

function updateWaveNumber(waveNumber) {
    const waveElement = document.querySelector('.wave-container');
    waveElement.classList.add('wave-animation');
    waveElement.textContent = `Wave: ${waveNumber}`;
    
    // Ensure the wave text maintains its bloody styling
    waveElement.style.fontFamily = "'Creepster', cursive";
    waveElement.style.color = '#ff3333';
    waveElement.style.textShadow = '0 0 10px #800000';
    waveElement.style.letterSpacing = '2px';
    
    setTimeout(() => {
        waveElement.classList.add('shrink');
    }, 0);
    setTimeout(() => {
        waveElement.classList.remove('shrink');
    }, 300);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 0);

    // Remove notification after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 2000);
}

function showDamageIndicator(damage, x, y) {
    const indicator = document.createElement('div');
    indicator.classList.add('damage-indicator');
    indicator.textContent = `-${damage}`;
    document.body.appendChild(indicator);

    // Show indicator
    setTimeout(() => {
        indicator.classList.add('show');
    }, 0);

    // Remove indicator after animation
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 500);
    }, 1000);
}

function showAchievementNotification(message) {
    const indicator = document.createElement('div');
    indicator.classList.add('achievement-indicator');
    indicator.textContent = `🏆 ${message}`;
    document.body.appendChild(indicator);

    // Show notification with fade-in
    setTimeout(() => {
        indicator.classList.add('show');
    }, 0);

    // Remove notification after delay
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 500);
    }, 3000);
}

// Update weapon display with current weapon (can be called when switching weapons)
function updateWeaponDisplay(weaponName = 'Pistol') {
    if (weaponElement) {
        weaponElement.textContent = weaponName;
        
        // Apply style to ensure consistency with UI theme
        weaponElement.style.fontFamily = "'Creepster', cursive";
        weaponElement.style.color = '#ff3333';  // Changed back to red theme color
        weaponElement.style.textShadow = '0 0 10px #800000';  // Changed back to red theme shadow
    }
}

// Export UI functions to global scope
window.initUI = initUI;
window.updateUI = updateUI;
window.updateHealth = updateHealth;
window.damagePlayer = damagePlayer;
window.updateWeaponDisplay = updateWeaponDisplay; // Add the weapon display function
window.gameOver = gameOver;
window.updateWaveUI = updateWaveUI;
