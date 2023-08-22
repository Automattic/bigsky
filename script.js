document.addEventListener( "DOMContentLoaded", function() {
    const token = localStorage.getItem( "openai_token" );
    document.querySelector( '#openai_token' ).value = token;

    document.querySelector( '#config h2 a' ).addEventListener( 'click', function( e ) {
        document.querySelector( '#config form' ).classList.toggle( 'hidden' );
    });

    add_row( false );

    function add_row( description ) {
        const clone = document.querySelector('#app template').content.querySelector('tr').cloneNode( true );
        document.querySelector('#app tbody').appendChild( clone );
        if( description ) {
            clone.querySelector( '.prompt' ).value = description;
            return Promise.resolve( clone );
        }
        if ( ! token ) {
            return Promise.resolve( clone );
        }
        // We do not have a description, but we DO have a token, so let's have the description auto-generated.
        clone.querySelector( '.prompt' ).value = 'Auto generating description';
        openaiCall(
            token,
            'gpt-4',
            'Please act as a user trying to describe a website they want built. Please invent a business, organization or a niche for a creator and create a one-paragraph description of a website for that person.',
            null,
            0.95
        ).then( output => {
            clone.querySelector( '.prompt' ).value = output;
            return Promise.resolve( clone );
        } )
    }


    document.querySelector( '#generate' ).addEventListener('click', function( e ) {
        e.stopPropagation();
        e.preventDefault();
        const row = document.querySelector('#app tbody').lastElementChild;

        if ( document.querySelector( '#openai_token' ).value.length < 1 ) {
            alert( 'You forgot about the OpenAI token' );
            return;
        }
        if ( row.querySelector( '.prompt' ).value.length < 1 ) {
            alert( 'Prompt cannot be empty' );
            return;
        }

        row.querySelector( '.output' ).value = 'WAIT PLIZ. Generating...';
        row.querySelector( '.assembler_links' ).innerHTML = '';

        const token = document.querySelector( '#openai_token' ).value;
        const model = document.querySelector( '#openai_model' ).options[ document.querySelector( '#openai_model' ).selectedIndex ].value;

        let replacements = {
            SEP: '<--------------->',
            PROMPT: row.querySelector( '.prompt' ).value,
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
             row.querySelector( '.output' ).value = output;
             return getPatternMap();
         } ).then( patternMap => {
            return Promise.resolve( mapOutputToPages( row.querySelector( '.output' ).value, replacements, patternMap, row ) );
        } ).then( pages =>{
            console.log( pages );
            pages.forEach( page => {
                const link = document.createElement( 'LI' );
                link.innerHTML = `<a target='_blank' href='https://container-great-cori.calypso.live/setup/with-theme-assembler/patternAssembler?ref=calypshowcase&siteSlug=patternassemblertest2.wordpress.com&pattern_ids=${page.patterns.join( ',' )}'>${page.title}</a>`;
                row.querySelector( '.assembler_links' ).appendChild( link );
            } );
        } );
        add_row( false );
    } );

    document.querySelector( '#config form' ).addEventListener( 'submit', function( e ) {
        e.stopPropagation();
        e.preventDefault();
        localStorage.setItem( "openai_token", document.querySelector( '#openai_token' ).value );
    } );
} );

function mapOutputToPages( output, replacements, patternMap, row ) {

    pages = output.split( replacements[ 'SEP' ] );
    pages = pages.map( page => {
        let lines = page.trim().split(/\r?\n/);

        if ( lines.length < 2 ) {
            return false;
        }

        lines = lines.filter( line => line.length > 1 );
        return {
            title: lines[0],
            patterns: lines.slice(1).map( line => {
                row.querySelector('.result_total').innerText = parseInt( row.querySelector('.result_total').innerText ) + 1;
                if ( ! patternMap[ line ] ) {
                    console.warn( 'Missing pattern: ' + line, lines[0] );
                    row.querySelector('.result_hal').innerText = parseInt( row.querySelector('.result_hal').innerText ) + 1;
                    return false;
                }
                return patternMap[ line ]
            } ).filter( Boolean ),
        };
    } ).filter( Boolean );
    return pages;
}


async function getPatternMap() {
    const response = await fetch( 'https://public-api.wordpress.com/rest/v1/ptk/patterns/en' );
    const data = await response.json();
    const patternMap = {};
    data.forEach(element => {
        patternMap[ element.name ] = element.ID;
    });
    return patternMap;
}

async function openaiCall( token, model, prompt, replacements = {}, temperature = 0 ) {

    for ( const pat in replacements ) {
        prompt = prompt.replaceAll( "[" + pat + "]", replacements[ pat ] );    
    }

    const requestBody = JSON.stringify({
        model: model,
        temperature: temperature,
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
