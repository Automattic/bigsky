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

        generateWebsite(
            document.querySelector( '#openai_token' ).value,
            document.querySelector( '#prompt' ).value,
            document.querySelector( '#prompt_patterns' ).value,
            document.querySelector( '#output_format' ).value
        ).then( output => {
            document.querySelector( '#output' ).value = output;
        } )
    } );
} );

async function generateWebsite( token, userPrompt, template, output ) {
    let systemPrompt = template;
    systemPrompt = systemPrompt.replace( '[FORMAT]', output );

    const requestBody = JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: userPrompt,
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
