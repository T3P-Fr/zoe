/*
	============================================================
	zoe.js — LE POINT D'ENTRÉE JS. Le pendant de zoe.css : une page importe ÇA, et tout
	Zoé est défini.
	------------------------------------------------------------
	    <link rel="stylesheet" href="/zoe.css">
	    <link rel="stylesheet" href="/skins/hightech/hightech.css">
	    <script type="module" src="/zoe.js"></script>

	Une page qui ne veut qu'un composant importe son module directement
	(`components/z-button/z-button.js`) : chaque module se définit seul et n'a besoin de
	rien d'autre que du noyau. Ce fichier n'est qu'une liste — il ne contient aucune
	logique, et il est VÉRIFIÉ par scripts/check.mjs : un composant absent d'ici ou de
	zoe.css fait échouer le contrôle. Les deux listes ne peuvent pas diverger en silence.

	Ordre : le noyau, les outils, puis les composants par ordre alphabétique (aucun
	composant ne dépend d'un autre ; z-radio-group importe lui-même z-radio).
	Styleguide 0.0
	============================================================
*/

/* 1 · LE NOYAU */
import "./core/z-element/z-element.js";
import "./core/z-layer/z-layer.js";

/* 2 · LES OUTILS — l'effet au contact, le canal, le sillage, les capteurs */
import "./tools/z-contact/z-contact.js";
import "./tools/z-channel/z-channel.js";
import "./tools/z-cursor/z-cursor.js";
import "./tools/z-pointer/z-pointer.js";
import "./tools/z-scroll/z-scroll.js";
import "./tools/z-inview/z-inview.js";
import "./tools/z-size/z-size.js";
import "./tools/z-drag/z-drag.js";

/* 3 · LES COMPOSANTS */
import "./components/z-accordion/z-accordion.js";
import "./components/z-alert/z-alert.js";
import "./components/z-avatar/z-avatar.js";
import "./components/z-avatar-group/z-avatar-group.js";
import "./components/z-badge/z-badge.js";
import "./components/z-breadcrumb/z-breadcrumb.js";
import "./components/z-button/z-button.js";
import "./components/z-card/z-card.js";
import "./components/z-checkbox/z-checkbox.js";
import "./components/z-checkbox-group/z-checkbox-group.js";
import "./components/z-code/z-code.js";
import "./components/z-dialog/z-dialog.js";
import "./components/z-disclosure/z-disclosure.js";
import "./components/z-divider/z-divider.js";
import "./components/z-drawer/z-drawer.js";
import "./components/z-field/z-field.js";
import "./components/z-kbd/z-kbd.js";
import "./components/z-menu/z-menu.js";
import "./components/z-meter/z-meter.js";
import "./components/z-pagination/z-pagination.js";
import "./components/z-popover/z-popover.js";
import "./components/z-progress/z-progress.js";
import "./components/z-radio/z-radio.js";
import "./components/z-radio-group/z-radio-group.js";
import "./components/z-rating/z-rating.js";
import "./components/z-segmented/z-segmented.js";
import "./components/z-skeleton/z-skeleton.js";
import "./components/z-slider/z-slider.js";
import "./components/z-spinner/z-spinner.js";
import "./components/z-stat/z-stat.js";
import "./components/z-stepper/z-stepper.js";
import "./components/z-switch/z-switch.js";
import "./components/z-tabs/z-tabs.js";
import "./components/z-tag/z-tag.js";
import "./components/z-toast/z-toast.js";
import "./components/z-tooltip/z-tooltip.js";
