import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		position: 'popup',
		showButtons: 'on-demand', // Or 'always'
		width: '',
	},
	migrations: [
		options => {
			let {width} = options;
			// Ignore if unset
			if (!width) {
				return;
			}

			// Parse them and clamp the value
			width = Math.min(Math.max(250, Number.parseInt(width, 10)), 1000);

			options.width = Number.isNaN(width) ? '' : width;
		},
	],
});

export default optionsStorage;

const defaultPopup = chrome.runtime.getManifest().action.default_popup;

export async function matchOptions() {
	const {position} = await optionsStorage.getAll();
	chrome.action.setPopup({popup: position === 'popup' ? defaultPopup : ''});

	const inSidebar = position === 'sidebar';
	chrome.sidePanel.setOptions({enabled: inSidebar});
	chrome.sidePanel.setPanelBehavior({
		openPanelOnActionClick: inSidebar,
	});
}

export async function getCustomNames() {
	const {customNames} = await optionsStorage.getAll();
	return customNames || {};
}

export async function setCustomName(extensionId, customName) {
	const customNames = await getCustomNames();

	if (customName && customName.trim()) {
		customNames[extensionId] = customName.trim();
	} else {
		delete customNames[extensionId];
	}

	await optionsStorage.set({customNames});
}

export async function removeCustomName(extensionId) {
	const customNames = await getCustomNames();

	if (customNames[extensionId]) {
		delete customNames[extensionId];
		await optionsStorage.set({customNames});
	}
}
