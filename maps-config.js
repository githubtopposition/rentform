// maps-config.js
export function initAutocompleteFor(inputEl) {
  if (typeof google !== "undefined" && google.maps && google.maps.places) {
    const autocomplete = new google.maps.places.Autocomplete(inputEl, {
      types: ["address"]
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      console.log("Selected place =>", place);
      // Можно убрать поля City/State, т.к. всё будет в одном
    });
  } else {
    console.warn("Google Maps not loaded or 'places' not available.");
  }
}
