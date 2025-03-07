// maps-config.js
// Пример. Если нужно автокомплит Google Maps:

export function initAutocompleteFor(inputEl) {
  if (typeof google !== "undefined" && google.maps && google.maps.places) {
    const autocomplete = new google.maps.places.Autocomplete(inputEl, {
      types: ["address"]
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      console.log("Selected place =>", place);
      // Разберите place.address_components, заполните city/state/zip,
      // или просто оставьте в логах
    });
  } else {
    console.warn("Google Maps script not loaded or places not available.");
  }
}
