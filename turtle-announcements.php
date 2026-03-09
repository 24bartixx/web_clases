<?php
/**
 * Plugin Name: Turtle Announcements
 * Description: Display announcements for recent posts
 * Version: 1.0
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * Author: Bartosz Wacławiak
 * Author URI: https://github.com/24bartixx
 */

function add_admin_menu_options() {
    add_options_page(
        "Turtle Announcements Options Menu",        // page title
        "Turtle Announcements",                     // Menu title
        'manage_options',                           // Capability
        "turtle_announcements_options_menu",        // Menu slug
        "generate_admin_panel"                      // Callback function
    );
}

add_action( 'admin_menu', 'add_admin_menu_options' );

function generate_admin_panel() {

    global $_POST;  

    // current state
    $opDays = get_option( 'ta_days', 7 );
    $announcements = get_option('ta_announcements_list', []);

    // handle days logic
    if ( isset( $_POST['ta_do_change'] ) && $_POST['ta_do_change'] == 'Y' ) {
        $opDays = intval($_POST['ta_days']);
        update_option( 'ta_days', $opDays );
        echo '<div class="notice notice-success is-dismissible"><p>Ustawienia czasu zapisane.</p></div>';
    }

    // handle announcement addition
    if (isset($_POST['add_new_announcement']) && !empty($_POST['new_announcement_html'])) {
        check_admin_referer('ta_add_announcement_nonce');
        $announcements[] = wp_unslash($_POST['new_announcement_html']);
        update_option('ta_announcements_list', $announcements);
        echo '<div class="notice notice-success is-dismissible"><p>Ogłoszenie dodane!</p></div>';
    } 
    // handle announcement deletion via POST
    else if (isset($_POST['delete_announcement_id'])) {
        check_admin_referer('ta_delete_announcement_nonce');
        $id = intval($_POST['delete_announcement_id']);
        if (isset($announcements[$id])) {
            unset($announcements[$id]);
            update_option('ta_announcements_list', array_values($announcements));
            $announcements = get_option('ta_announcements_list', []);
            echo '<div class="notice notice-warning is-dismissible"><p>Ogłoszenie usunięte.</p></div>';
        }
    }

    ?>
    <div class="wrap">
        <h1>Turtle Announcements</h1>
        
        <div class="card">
            <h2>Ustawienia wyświetlania</h2>
            <form method="post">
                <input type="hidden" name="ta_do_change" value="Y">
                <p>
                    Pokazuj ogłoszenia w postach nie starszych niż:
                    <input type="number" name="ta_days" min="0" max="365" value="<?php echo esc_attr($opDays); ?>"> dni.
                </p>
                <p class="submit"><input type="submit" class="button button-primary" value="Zapisz limit dni"></p>
            </form>
        </div>

        <hr>

        <div class="card">
            <h2>Dodaj nowe ogłoszenie (HTML)</h2>
            <form method="post">
                <?php wp_nonce_field('ta_add_announcement_nonce'); ?>
                <textarea name="new_announcement_html" rows="4" style="width:100%; font-family:monospace;" placeholder="Some announcement"></textarea>
                <p><input type="submit" name="add_new_announcement" class="button button-primary" value="Dodaj ogłoszenie do puli"></p>
            </form>
        </div>

        <hr>

        <h2>Twoje ogłoszenia (losowane w postach)</h2>
        <table class="wp-list-table widefat fixed striped" style="width:50%;">
            <thead>
                <tr>
                    <th>Treść</th>
                    <th style="width: 100px;">Opcje</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($announcements)): ?>
                    <tr><td colspan="2">Brak zdefiniowanych ogłoszeń</td></tr>
                <?php else: ?>
                    <?php foreach ($announcements as $index => $announcement): ?>
                    <tr>
                        <td><code><?php echo esc_html($announcement); ?></code></td>
                        <td>
                            <form method="post" style="display:inline;">
                                <?php wp_nonce_field('ta_delete_announcement_nonce'); ?>
                                <input type="hidden" name="delete_announcement_id" value="<?php echo esc_attr($index); ?>">
                                <button type="submit" class="button button-link-delete" onclick="return confirm('Na pewno usunąć?')">Usuń</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

function ta_mark_new_post_title($content, $id){
    
    //read post publish date
    $date = get_the_date('Ymd', $id);
    //get current date
    $now = date('Ymd');
    //get setting for how long post is a new post
    $opDays = get_option('ta_days'); 

    //generate proper post title
    if($now - $date <= $opDays)
    return $content."<sup class=\"ta_marker\">ANNOUNCEMENT</sup>";
    return $content;
}

add_filter("the_title", "ta_mark_new_post_title", 10, 2); 

function ta_add_post_announcement( $content ) {
    $id = get_the_ID();
    if ( ! $id ) {
        return $content;
    }

    //read post publish date
    $date = get_the_date('Ymd', $id);
    //get current date
    $now = date('Ymd');
    //get setting for how long post is a new post
    $opDays = get_option('ta_days'); 

    if($now - $date <= $opDays) {
        $announcements = get_option('ta_announcements_list', []);
        
        if (!empty($announcements)) {
            $random_announcement = $announcements[ array_rand( $announcements ) ];
            $announcement = '<p class="ta_notice">' . $random_announcement . '</p>';
            return $announcement . $content;
        }
    }
    return $content;
}

add_filter( 'the_content', 'ta_add_post_announcement' );

function ta_add_toolbar_link($wp_admin_bar) {
    $args = array(
        'id'    => 'turtle_announcements_settings',
        'title' => '🐢Ogłoszenia🐢',
        'href'  => admin_url('options-general.php?page=turtle_announcements_options_menu'),
    );
    $wp_admin_bar->add_node($args);
}

add_action('admin_bar_menu', 'ta_add_toolbar_link', 999);

function ta_add_dashboard_widget() {
    wp_add_dashboard_widget(
        'ta_dashboard_widget',
        'Turtle Announcements - Zarządzanie',
        'ta_dashboard_widget_display'
    );
}

function ta_dashboard_widget_display() {
    $announcements = get_option('ta_announcements_list', []);
    $count = count($announcements);
    
    echo "<p>Masz obecnie <strong>$count</strong> aktywnych ogłoszeń w puli.</p>";
    
    if ($count > 0) {
        $random = $announcements[array_rand($announcements)];
        echo "<hr><p><em>Losowy podgląd:</em></p>";
        echo "<div style='background:#f0f0f0; padding:10px; border-left:4px solid #0073aa;'>" . $random . "</div>";
    }
    
    echo '<p><a href="options-general.php?page=turtle_announcements_options_menu" class="button button-primary">Zarządzaj ogłoszeniami</a></p>';
}

add_action('wp_dashboard_setup', 'ta_add_dashboard_widget', 1);


function ta_handle_shortcode() {
    $announcements = get_option('ta_announcements_list', []);
    if (empty($announcements)) return '';

    $random = $announcements[array_rand($announcements)];
    return '<div class="ta_notice ta_shortcode">' . $random . '</div>';
}

add_shortcode('turtle_announcement', 'ta_handle_shortcode');

function ta_register_styles(){
    // register style 
    wp_register_style('ta_styles', plugins_url('/css/styles.css', __FILE__));
    // enable style
    wp_enqueue_style('ta_styles');
}

add_action('init', 'ta_register_styles'); 


