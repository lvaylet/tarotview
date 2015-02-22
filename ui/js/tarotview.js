$(function() {

    // AJAX activity indicator bound to ajax start/stop document events
    $(document).ajaxStart(function() {
        $('#loadingIndicator').show();
    }).ajaxStop(function() {
        $('#loadingIndicator').hide();
    });

    // Afficher le classement général au démarrage
    displayGlobalRanking();

    // Cacher les alertes
    $('.alert').hide();
    $('#loadingIndicator').hide();

    // Cacher le graphe d'historiaue des scores au démarrage
    $('#graphScoresHistory').hide();

    // Convertir en majuscules les champs marqués avec .uppercase
    $('body').on('blur', 'input.uppercase', function() {
        $(this).val(function(i, val) {
            return val.toUpperCase();
        });
    });

    // Convertir en majuscule la première lettre des champs marqués avec .capitalize
    $('body').on('blur', 'input.capitalize', function() {
        $(this).val(function(i, val) {
            return val.replace(/\b./g, function(m) {
                return m.toUpperCase();
            });
        });
    });

    // Configurer et initialiser les sélecteurs de date
    $('.datepicker').datepicker({
        format: 'yyyy-mm-dd',
        daysOfWeekDisabled: '0,6', // Saturday and Sunday are disabled
        autoclose: true,
        todayHighlight: true,
        language: 'fr'
    }).val(getTodayDate());

    // Empêcher les clics sur les onglets désactivés de la barre de navigation
    $('ul#navBar > li > a[data-toggle=tab]').on('click', function(e) {
        if ($(this).parent('li').hasClass('disabled')) {
            e.preventDefault();
            return false;
        }
    });

    // Administrator mode
    $('#formLogin #buttonSubmitAdminPassword').click(function(e) {
        e.preventDefault();

        $.ajax({
            url: 'controller.php',
            type: 'post',
            data: {action: 'login', password: $('#inputAdminPassword').val()},
            success: function(isAdmin) {
                isAdmin = $.parseJSON(isAdmin);
                if (isAdmin) {
                    // Enable the previsouly disabled navigation items
                    $('ul#navBar > li.disabled').removeClass('disabled');
                    // Hide login form
                    $('#formLogin').parent('li').fadeOut('fast');
                } else {
                    // Display validation state with icon feedback
                    $('#formLogin > .form-group').addClass('has-error');
                    $('#inputAdminPassword').attr('placeholder', 'invalid');
                    // Clear password
                    $('#inputAdminPassword').val('');
                }
            }
        });
    });

    /* --- Onglet 'Classement Général' --- */

    function displayGlobalRanking() {
        $.ajax({
            url: 'controller.php',
            type: 'post',
            data: {action: 'get_global_ranking'},
            success: function(data) {
                data = $.parseJSON(data);

                var results = [];

                if (data.length === 0) {
                    results = '<tr><td colspan="4">Aucun joueur présent dans la base.</td></tr>';
                } else {
                    var additionalRow = '';
                    $.each(data, function(index, item) {
                        var ranking = index + 1; // indexing is zero-based
                        additionalRow = [
                            '<tr data-player="' + item.last_name + '">',
                            '  <td>' + ranking + '</td>',
                            '  <td>' + item.last_name + '</td>',
                            '  <td>' + item.first_name + '</td>',
                            '  <td>' + item.total + '</td>',
                            '</tr>'
                        ].join('\n');
                        results.push(additionalRow);
                    });
                }
                $('#tableGlobalRanking tbody').html(results);
            }
        });
    }

    $('body').on('click', '#tableGlobalRanking tr:not(:first)', function() {
        // A row was clicked
        var last_name = $(this).data('player');

        $.ajax({
            url: 'controller.php',
            type: 'post',
            data: {action: 'get_scores', last_name: last_name},
            success: function(data) {

                // renderScoresHistory($.parseJSON(data));

                data = $.parseJSON(data);
                var xy = $.map(data, function(n) {
                    // Extract year, month and day from date string
                    var parts = n.created_on.split('-');
                    // Build an (x,y) pair with date and total points scored
                    return [[Date.UTC(parts[0], parts[1] - 1, parts[2]), n.total]];
                });

                if (!$('#graphScoresHistory').is(":visible")) {
                    $('#graphScoresHistory').fadeIn("slow");
                }

                $('#graphScoresHistory').highcharts({
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: 'Historique des scores'
                    },
                    xAxis: {
                        type: 'datetime'
                    },
                    yAxis: {
                        title: {
                            text: 'Points'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                            name: 'Score',
                            data: xy,
                            /*
                             color: '#4682B4',
                             negativeColor: '#A52A2A'
                             */
                            color: 'rgba(70,130,180, 0.8)',
                            negativeColor: 'rgba(165,42,42, 0.8)'
                        }],
                    plotOptions: {
                        series: {
                            states: {
                                hover: {
                                    enabled: false
                                }
                            }
                        }
                    }
                });
            }
        });
    });

    /* --- Onglet 'Rentrer des scores' --- */

    // Instantiate the bloodhound suggestion engine
    var players = new Bloodhound({
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.last_name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: 'controller.php?query=%QUERY'
        }
    });

    players.initialize();

    var nb_players_on_table = 1;
    function generate_new_form_group_score() {
        // Increment number of players on table
        nb_players_on_table++;
        // Create new form-group
        return [
            '<div class="form-group form-group-player">',
            '    <label class="col-md-2 control-label">Joueur #' + nb_players_on_table + '</label>',
            '    <div class="col-md-2">',
            '        <input type="text" class="form-control uppercase typeahead last-name" placeholder="NOM" autocomplete="off" spellcheck="false">',
            '    </div>',
            '    <div class="col-md-2">',
            '        <input type="text" class="form-control first-name" placeholder="Prénom" spellcheck="false" disabled>',
            '    </div>',
            '    <div class="col-md-1">',
            '        <input type="text" class="form-control score" placeholder="Score">',
            '    </div>',
            '</div>'].join('\n');
    }

    $('#buttonAddPlayer').hover(
            function() {
                // Save current HTML code (button image)
                $(this).data('html', $(this).html());

                // Append tooltip to button icon
                $(this).append(' Ajouter');
            },
            function() {
                // Restore initial HTML code (saved in first callback)
                $(this).html($(this).data('html'));
            }
    );

    $('#buttonRemovePlayer').hover(
            function() {
                // Save current HTML code (button image)
                $(this).data('html', $(this).html());

                // Append tooltip to button icon
                $(this).append(' Supprimer');
            },
            function() {
                // Restore initial HTML code (saved in first callback)
                $(this).html($(this).data('html'));
            }
    );

    $('#buttonRemovePlayer').click(function(e) {
        e.preventDefault();

        if (nb_players_on_table > 2) {

            // Fade last form-group out of view
            $('div.form-group-player').last().fadeOut('fast', function() {

                // Remove form-group element from DOM once fading animation is complete
                $(this).remove();

                // Decrement number of players on table
                nb_players_on_table--;
            });
        }
    });

    $('#buttonAddPlayer').click(function(e) {
        e.preventDefault();

        // Add a new player to the form
        $('div.form-group-player').last().after(generate_new_form_group_score());

        // Enable Twitter typeahead on newly added form-group
        $('input.typeahead').typeahead('destroy').typeahead({
            highlight: true,
            autoselect: true
        },
        {
            displayKey: 'last_name',
            source: players.ttAdapter()
        });
    });

    // Ajouter 4 joueurs dans l'onglet 'Saisir des scores',
    // pour un total de 5 joueurs par défaut
    $('#buttonAddPlayer').trigger('click');
    $('#buttonAddPlayer').trigger('click');
    $('#buttonAddPlayer').trigger('click');
    $('#buttonAddPlayer').trigger('click');

    // Trouver et afficher le prénom du joueur quand le champ 'NOM' perd le focus
    $('body').on('blur', 'input.typeahead', function() {
        var matching_first_name = $(this).closest('div.form-group').find('input.first-name');
        $.ajax({
            url: 'controller.php',
            type: 'post',
            data: {action: 'get_player_first_name', last_name: $(this).val()},
            success: function(data) {
                data = $.parseJSON(data);
                matching_first_name.val(data.first_name);
            }
        });
    });

    // Soumettre les nouveaux scores
    $('#buttonSubmitNewScores').click(function(e) {

        e.preventDefault();

        // Hide alerts
        $('#alertErrorTotalPoints').hide();
        $('#alertSuccessNewScores').hide();

        var total_points = null;
        $('#tabNewScores .score').each(function(index, element) {
            total_points += parseInt($(element).val(), 10);
        });

        if (total_points === 0) {
            var submitDate = $('.datepicker').val();
            var submitLastName = '';
            var submitScore = 0;

            var playerNames = [];

            // Loop over each player to extract last name and score
            $('#tabNewScores input.last-name.tt-input').each(function(index, element) {

                submitLastName = $(element).val();
                submitScore = parseInt($(element).closest('div.form-group').find('.score').val());

                // Ajouter une entrée dans la base avec l'ID du joueur, le score et la date du jour
                $.ajax({
                    url: 'controller.php',
                    type: 'post',
                    data: {action: 'create_score', date: submitDate, last_name: submitLastName, score: submitScore},
                    success: function(nbRowsAffected) {
                        nbRowsAffected = $.parseJSON(nbRowsAffected);
                        // @TODO Vérifier que nbRowsAffected === 1, sinon afficher une alerte
                    }
                });

                playerNames.push(submitLastName);
            });

            $('#alertSuccessNewScores #submittedPlayers').text(playerNames.join(', '));
            $('#alertSuccessNewScores').fadeIn('fast');

            // Update and display global ranking
            displayGlobalRanking();

        } else {
            // Display error alert
            $('#alertErrorTotalPoints #totalPoints').text(total_points);
            $('#alertErrorTotalPoints').fadeIn('fast');
        }
    });

    /* --- Onglet 'Ajouter un joueur' --- */

    // @TODO Vérifier que le joueur n'existe pas déjà
    // @TODO Verifier que les champs sont valides (et donner du feedback avec .has-error)

    $('#buttonCreatePlayer').click(function(e) {
        e.preventDefault();

        var firstName = $('#inputNewPlayerFirstName').val();
        var lastName = $('#inputNewPlayerLastName').val();

        if (firstName !== '' && lastName !== '') {
            $.ajax({
                url: 'controller.php',
                type: 'post',
                data: {action: 'create_player', first_name: firstName, last_name: lastName},
                success: function(nbRowsAffected) {
                    nbRowsAffected = $.parseJSON(nbRowsAffected);
                    if (nbRowsAffected === 1) {
                        // Clear form fields
                        $('#alertSuccessPlayerCreated #newPlayer').text(firstName + ' ' + lastName);
                        $('#alertSuccessPlayerCreated').show();
                        $('#tabNewPlayer input[type=text]').val('');
                    }
                    // @TODO Vérifier que nbRowsAffected === 1, sinon afficher une alerte
                }
            });
        }
    });

    // Today as yyyy-mm-dd
    function getTodayDate() {
        var d = new Date();

        var month = d.getMonth() + 1;
        var day = d.getDate();

        var output = [
            d.getFullYear(),
            (month < 10 ? '0' : '') + month,
            (day < 10 ? '0' : '') + day].join('-');

        return output;
    }
});

/*

<script src="ui/js/d3.v3.min.js"></script>
<script src="ui/js/d3.tip.v0.6.3.js"></script>

.bar.positive {
    fill: steelblue;
    fill-opacity: 0.8;
}

.bar.negative {
    fill: brown;
    fill-opacity: 0.8;
}

.bar:hover {
    fill-opacity: 1;
}

.axis path,
.axis line {
    fill: none;
    stroke: #000;
    shape-rendering: crispEdges;
}

.x.axis text {
    display: none;
}

.d3-tip {
    line-height: 1;
    font-weight: bold;
    padding: 12px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    border-radius: 2px;
}

.d3-tip:after {
    box-sizing: border-box;
    display: inline;
    font-size: 10px;
    width: 100%;
    line-height: 1;
    color: rgba(0, 0, 0, 0.8);
    content: "\25BC";
    position: absolute;
    text-align: center;
}

.d3-tip.n:after {
    margin: -1px 0 0 0;
    top: 100%;
    left: 0;
}

function renderScoresHistory(data) {

    var margin = {top: 10, right: 20, bottom: 30, left: 50},
    width = 920 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
            .range([height, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left');

    var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return d.total + ' points le ' + d.created_on;
            });

    $('#graphScoresHistory').html('');
    // @TODO Détecter qu'un graphe est déjà présent
    var svg = d3.select('#graphScoresHistory').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.call(tip);

    x.domain(data.map(function(d) {
        return d.created_on;
    }));
    var y0 = d3.max(d3.extent(data, function(d) {
        return Math.abs(d.total);
    }));
    y.domain([-y0 * 1.05, y0 * 1.05]).nice();

    svg.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', y(0))
            .attr('y2', y(0))
            .style('stroke', 'gray')
            .style('stroke-width', 1)
            .style('stroke-opacity', 0.4);

    svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

    svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

    svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', function(d) {
                return d.total < 0 ? 'bar negative' : 'bar positive';
            })
            .attr('x', function(d) {
                return x(d.created_on);
            })
            .attr('width', x.rangeBand())
            .attr('y', function(d) {
                return y(Math.max(0, d.total));
            })
            .attr('height', function(d) {
                return Math.abs(y(d.total) - y(0));
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
}

*/
