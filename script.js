document.addEventListener( "DOMContentLoaded", function() {
    document.querySelector( '#app form' ).addEventListener('submit', function( e ) {
        e.stopPropagation();
        e.preventDefault();
        if ( document.querySelector( '#openai_token' ).value.length < 1 ) {
            alert( 'You forgot about the OpenAI token' );
            return;
        }
        if ( document.querySelector( '#prompt' ).value.length < 1 ) {
            alert( 'Prompt cannot be empty' );
            return;
        }

        document.querySelector( '#output' ).value = 'WAIT PLIZ. Generating...';

        const token = document.querySelector( '#openai_token' ).value;
        const model = document.querySelector( '#openai_model' ).options[ document.querySelector( '#openai_model' ).selectedIndex ].value;

        let replacements = {
            SEP: '<--------------->',
            PROMPT: document.querySelector( '#prompt' ).value,
            PATTERNS: document.querySelector( '#pattern_descriptions' ).value,
        };

        openaiCall(
            token,
            model,
            document.querySelector( '#prompt_layout' ).value,
            replacements
        ).then( output => {
            replacements['LAYOUT'] = output;
            return openaiCall(
                token,
                model,
                document.querySelector( '#prompt_patterns' ).value,
                replacements
            );
        } ).then( output => {
             document.querySelector( '#output' ).value = output;
         } );

    } );
} );



async function openaiCall( token, model, prompt, replacements = {} ) {

    for ( const pat in replacements ) {
        prompt = prompt.replaceAll( "[" + pat + "]", replacements[ pat ] );    
    }

    const requestBody = JSON.stringify({
        model: model,
        messages: [
            {
                role: 'user',
                content: prompt,
            }
        ]
    });    
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: requestBody,
    };

    try {
        const response = await fetch( 'https://api.openai.com/v1/chat/completions', requestOptions );
        const data = await response.json();
        console.log( data );
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('No response text received from the AI model.');
        }
    } catch (error) {
        console.error('Error calling GPT API:', error);
        return null;
    }

}
