import time
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib import font_manager as fm
from matplotlib.gridspec import GridSpec
from PIL import Image, ImageDraw, ImageSequence
import numpy as np
from bidi.algorithm import get_display
import arabic_reshaper
import sys
import os


###### CONSTANTS ######
STARTING_AMPS = 0
MAX_AMPS = 10
ACCELERATION = 0.02

######################### PATHS #########################
empty_image_path = '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/empty_bar_graph.jpg'
full_image_path = '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/full_bar_graph.jpg'
opening_gif_path = '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/start/start_hebrew.gif'

font_paths = {
    'hebrew': '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/fonts/SimplerPro_HLAR-Semibold.otf',
    'english': '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/fonts/SimplerPro_HLAR-Semibold.otf',
    'arabic': '/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/fonts/NotoKufiArabic-SemiBold.ttf'
}

languages = ['hebrew', 'english', 'arabic']
current_language_index = 0
current_language = languages[current_language_index]

# Load images and set up display parameters
empty_img = Image.open(empty_image_path).convert("RGBA")
full_img = Image.open(full_image_path).convert("RGBA")
empty_img = empty_img.resize(full_img.size)
width, height = full_img.size
gif_frames = [frame.copy() for frame in ImageSequence.Iterator(Image.open(opening_gif_path))]

######################### GLOBALS & FLAGS #########################
is_opening_screen = True
ani_opening = None
ani_measuring = None
screen_state = "opening"  # Start with the opening screen

translations = {
    'hebrew': 'שחררתם {coulombs:.1f} קולומבים של חשמל!',
    'english': 'You released {coulombs:.1f} Coulombs of electric charge!',
    'arabic': 'لقد أطلقت {coulombs:.1f} كولوم من الشحنة الكهربائية!'
}

instruction_texts = {
    'hebrew': 'סובבו את הידית על מנת ליצור מתח חשמלי',
    'english': 'Turn the knob to generate electrical force',
    'arabic': 'لف المقبض لتوليد قوة كهربائية'
}

color_messages = {
    'yellow': {
        'hebrew': 'המשיכו לסובב עד שתגיעו לאזור הירוק',
        'english': 'Keep turning until you reach the green zone',
        'arabic': 'استمر في الدوران حتى تصل إلى المنطقة الخضراء'
    },
    'green': {
        'hebrew': 'אפשר לשגר',
        'english': 'Ready to launch',
        'arabic': 'جاهز للإطلاق'
    },
    'red': {
        'hebrew': 'חובה לשגר!',
        'english': 'Mandatory to launch!',
        'arabic': 'يجب الإطلاق الآن!'
    }
}

heading_text = {
    'hebrew': 'רקטת מימן',
    'english': 'Hydrogen Rocket',
    'arabic': 'صاروخ الهيدروجين'
}



######################### HELPER FUNCTIONS #########################


def calculate_charge(current, elapsed_time):
    """
    Calculate the charge (in Coulombs) based on current and elapsed time.
    
    Args:
        current (float): The current in Amperes.
        elapsed_time (float): The time in seconds over which the current flowed.
    
    Returns:
        float: The calculated charge in Coulombs.
    """
    return current * elapsed_time  # Q = I * t


def blend_images(amps, min_amps=0, max_amps=MAX_AMPS):
    normalized_amps = (amps - min_amps) / (max_amps - min_amps)
    fill_height = int(normalized_amps * height)
    
    mask = Image.new("L", empty_img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([0, height - fill_height, width, height], fill=255)
    
    return Image.composite(full_img, empty_img, mask)


def simulated_data_generator():
    current_value = STARTING_AMPS
    while current_value <= MAX_AMPS:
        yield current_value
        current_value += ACCELERATION
        time.sleep(0.2)


def calculate_charge_from_current(serial_connection):
    """
    Calculate the total charge (in Coulombs) from current (in Amperes) over time.
    
    Args:
        serial_connection: The serial connection to the Arduino.
        
    Returns:
        The accumulated charge (Q) in Coulombs.
    """
    total_charge = 0.0  # Initialize the total charge in Coulombs
    last_time = time.time()  # Record the start time
    
    while True:
        # Read current (in Amperes) from the Arduino
        if serial_connection.in_waiting > 0:
            try:
                current_data = serial_connection.readline().decode('utf-8').strip()
                current = float(current_data)  # Convert the current to a float (in Amperes)
                
                # Calculate the elapsed time since the last reading
                current_time = time.time()
                elapsed_time = current_time - last_time
                last_time = current_time
                
                # Calculate the charge for this interval
                charge = calculate_charge(current, elapsed_time)
                total_charge += charge  # Accumulate total charge
                
                print(f"Current: {current} A, Time: {elapsed_time:.2f} s, Charge: {charge:.4f} C, Total Charge: {total_charge:.4f} C")
                
            except ValueError:
                print("Error reading current data. Skipping this reading.")
                
        # Include a short sleep if needed to control the read frequency
        time.sleep(0.1)  # Adjust as necessary


hp_data_generator = simulated_data_generator()


def setup_measuring_screen():
    fig.clear()
    gs = GridSpec(5, 2, height_ratios=[1, 0.5, 2, 1, 1], width_ratios=[1, 1])

    # Top: Heading and Instruction
    ax1 = fig.add_subplot(gs[0, :])
    heading = heading_text[current_language]
    reshaped_heading = arabic_reshaper.reshape(heading) if current_language in ['arabic', 'hebrew'] else heading
    bidi_heading = get_display(reshaped_heading) if current_language in ['arabic', 'hebrew'] else reshaped_heading
    ax1.text(0.5, 0.5, bidi_heading, ha='center', va='center', fontsize=30,
             fontproperties=fm.FontProperties(fname=font_paths[current_language]), color='black')
    ax1.axis('off')

    ax2 = fig.add_subplot(gs[1, :])
    instruction = instruction_texts[current_language]
    reshaped_instruction = arabic_reshaper.reshape(instruction) if current_language in ['arabic', 'hebrew'] else instruction
    bidi_instruction = get_display(reshaped_instruction) if current_language in ['arabic', 'hebrew'] else reshaped_instruction
    ax2.text(0.5, 0.5, bidi_instruction, ha='center', va='center', fontsize=20,
             fontproperties=fm.FontProperties(fname=font_paths[current_language]), color='gray')
    ax2.axis('off')

    # Middle: Coulomb Shower
    ax3 = fig.add_subplot(gs[2, :])
    global shower_text
    shower_text = ax3.text(0.5, 0.5, '', ha='center', va='center', fontsize=15,
                           fontproperties=fm.FontProperties(fname=font_paths[current_language]), color='blue')
    ax3.axis('off')

    # Bottom Left: Timer
    ax4 = fig.add_subplot(gs[3, 0])
    global timer_text
    timer_text = ax4.text(0.5, 0.5, '0.0 s', ha='center', va='center', fontsize=20,
                          fontproperties=fm.FontProperties(fname=font_paths[current_language]), color='black')
    ax4.axis('off')

    # Bottom Right: Bar Graph
    ax5 = fig.add_subplot(gs[3, 1])
    global img_display
    img_display = ax5.imshow(np.zeros((height, width, 4), dtype=np.uint8))
    ax5.axis('off')

    # Bottom Text: Color Message
    ax6 = fig.add_subplot(gs[4, :])
    global color_text
    color_text = ax6.text(0.5, 0.5, '', ha='center', va='center', fontsize=20,
                          fontproperties=fm.FontProperties(fname=font_paths[current_language]), color='black')
    ax6.axis('off')

    plt.subplots_adjust(left=0, right=1, top=1, bottom=0, hspace=0, wspace=0)
    plt.tight_layout(pad=0)

    # print("Measuring screen setup complete.")  # Debug to confirm setup completion


def update_screen(frame):
    amps = next(hp_data_generator, MAX_AMPS)
    coulombs = amps * frame  # Simplified charge calculation

    # Debug: Print current amps and frame
    # print(f"Frame: {frame}, Amps: {amps}, Coulombs: {coulombs}")

    # Update Coulomb Shower
    shower_text.set_text(f'{coulombs:.1f} C')

    # Update Timer
    elapsed_time = frame * 0.2  # Assuming each frame is ~0.2 seconds
    timer_text.set_text(f'{elapsed_time:.1f} s')

    # Update Bar Graph
    result_img = blend_images(amps)
    img_display.set_data(np.array(result_img))

    # Determine the color level based on amps
    if amps < MAX_AMPS / 3:
        color = 'yellow'
    elif amps < 2 * MAX_AMPS / 3:
        color = 'green'
    else:
        color = 'red'

    # Get the appropriate message for the current color and language
    message = color_messages[color][current_language]

    # Handle RTL for Hebrew and Arabic languages
    if current_language in ['hebrew', 'arabic']:
        reshaped_message = arabic_reshaper.reshape(message)
        bidi_message = get_display(reshaped_message)
    else:
        bidi_message = message

    # Update the color message text without changing its color
    color_text.set_text(bidi_message)

    plt.draw()
    return [img_display, shower_text, timer_text, color_text]


def setup_opening_screen():
    """Display the opening screen in the selected language."""
    fig.clear()
    ax = fig.add_subplot(111)
    ax.axis('off')
    
    # Construct the path for the current language's opening image
    opening_image_path = f"/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/start/start_{current_language}.png"
    
    # Check if the file exists
    if os.path.exists(opening_image_path):
        opening_img = Image.open(opening_image_path)
        ax.imshow(opening_img)
        plt.draw()
        print(f"Opening screen displayed in {current_language}")  # Debug
    else:
        print(f"File not found: {opening_image_path}")  # Notify if file is missing


def setup_end_screen():
    """Display the end screen in the selected language."""
    fig.clear()
    ax = fig.add_subplot(111)
    ax.axis('off')
    
    # Construct the path for the current language's end image
    end_image_path = f"/Users/dolevsmac/Desktop/Hydrogen_Rocket/assets/end_screen/Hydro_end_{current_language}.png"
    
    # Check if the file exists
    if os.path.exists(end_image_path):
        end_img = Image.open(end_image_path)
        ax.imshow(end_img)
        plt.draw()
        # print(f"End screen displayed in {current_language}")  # Debug
    else:
        print(f"File not found: {end_image_path}")  # Notify if file is missing


def on_key_press(event):
    """Event handler to transition between screens on Enter key press."""
    global screen_state, ani_opening
    
    if event.key == 'enter':
        if screen_state == "opening":
            # Transition from opening to measuring screen
            print("Switching from opening to measuring screen...")
            screen_state = "measuring"
            if ani_opening:
                ani_opening.event_source.stop()  # Stop the opening animation

            # Clear the figure and set up the measuring screen
            fig.clf()
            setup_measuring_screen()
            plt.pause(0.1)  # Allow time for the screen to refresh

            # Manual update loop for measuring screen
            frame = 0
            while screen_state == "measuring":
                update_screen(frame)  # Call update function manually
                plt.pause(0.2)  # Adjust this interval as needed for smoothness
                frame += 1

        elif screen_state == "measuring":
            # Transition from measuring to end screen
            print("Switching from measuring to end screen...")
            screen_state = "end"

            # Clear the figure and set up the end screen
            fig.clf()
            setup_end_screen()
            plt.pause(0.1)  # Allow time for the screen to refresh


def change_language(event):
    global current_language, current_language_index, screen_state
    
    if event.key == ' ':
        # Cycle through the languages
        current_language_index = (current_language_index + 1) % len(languages)
        current_language = languages[current_language_index]
        print(f"Language switched to: {current_language}")  # Debug: Confirm language switch
        
        # Update the current screen based on `screen_state`
        if screen_state == "opening":
            # Display the correct language version of the opening screen
            setup_opening_screen()
        elif screen_state == "measuring":
            # Re-setup the measuring screen with the new language
            setup_measuring_screen()
        elif screen_state == "end":
            # Display the correct language version of the end screen
            setup_end_screen()


def close_app(event):
    sys.exit(0)

# Initialize the figure and connect the key press event handler
fig, _ = plt.subplots(figsize=(10, 8))
fig.canvas.mpl_connect('key_press_event', on_key_press)
fig.canvas.mpl_connect('key_press_event', change_language)
fig.canvas.mpl_connect('close_event', close_app)

# Display the opening screen
setup_opening_screen()
plt.show()
