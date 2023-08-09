document.addEventListener( "DOMContentLoaded", function() {
    document.querySelector( '#app form' ).addEventListener('submit', function( e ) {
        e.stopPropagation();
        e.preventDefault();
        const output = generateWebsite(
            document.querySelector( '#openai_token' ).value,
            document.querySelector( '#prompt' ).value,
            document.querySelector( '#prompt_patterns' ).value,
            document.querySelector( '#output_format' ).value
        );
        document.querySelector( '#output' ).value = output;
    } );
} );

function generateWebsite( token, prompt, template, output ) {
    let effectivePrompt = template;
    effectivePrompt = effectivePrompt.replace( '[CUSTOMER_PROMPT]', prompt );
    effectivePrompt = effectivePrompt.replace( '[FORMAT]', output );

    return effectivePrompt;
}
